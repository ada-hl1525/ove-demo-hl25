import re
import sys
import logging
import datetime
import urllib.request

from app.core.config import get_settings

settings = get_settings()

# --- Constants ----------------------------------------------------------------

APP_LOG_ID_WIDTH = 16

RegExp = {
    "Annotation": {
        "NAME": re.compile(r"@NAME"),
        "APP_NAME": re.compile(r"@APP_NAME"),
        "VERSION": re.compile(r"@VERSION"),
        "LICENSE": re.compile(r"@LICENSE"),
        "AUTHOR": re.compile(r"@AUTHOR"),
    }
}

LogLevels = {
    "fatal": {
        "name": "FATAL",
        "consoleLogger": "error",
        "level": 0,
        "label": {"bgColor": "#FF0000", "color": "#FFFFFF"},
    },
    "error": {
        "name": "ERROR",
        "consoleLogger": "error",
        "level": 1,
        "label": {"bgColor": "#B22222", "color": "#FFFAF0"},
    },
    "warn": {
        "name": "WARN",
        "consoleLogger": "warn",
        "level": 2,
        "label": {"bgColor": "#DAA520", "color": "#FFFFF0"},
    },
    "info": {
        "name": "INFO",
        "consoleLogger": "log",
        "level": 3,
        "label": {"bgColor": "#2E8B57", "color": "#FFFAFA"},
    },
    "debug": {
        "name": "DEBUG",
        "consoleLogger": "log",
        "level": 4,
        "label": {"bgColor": "#1E90FF", "color": "#F8F8FF"},
    },
    "trace": {
        "name": "TRACE",
        "consoleLogger": "log",
        "level": 5,
        "label": {"bgColor": "#808080", "color": "#FFFAF0"},
    },
}

# --- Define TRACE level ------------------------------------------------------

TRACE_LEVEL_NUM = 5
logging.addLevelName(TRACE_LEVEL_NUM, "TRACE")


def hex_to_rgb(hexstr):
    hexstr = hexstr.lstrip("#")
    return tuple(int(hexstr[i: i + 2], 16) for i in (0, 2, 4))


class MaxLevelFilter(logging.Filter):
    """Allows only records at or below a given level."""

    def __init__(self, level):
        super().__init__()
        self.level = level

    def filter(self, record):
        return record.levelno <= self.level


class MinLevelFilter(logging.Filter):
    """Allows only records at or above a given level."""

    def __init__(self, level):
        super().__init__()
        self.level = level

    def filter(self, record):
        return record.levelno >= self.level


class Logger:
    def __init__(self):
        # Underlying Python logger
        self.logger = logging.getLogger(settings.app_name)
        # Avoid duplicate handlers if already configured
        if not self.logger.handlers:
            self._configure_handlers()

        # Always let us emit everything; we filter manually
        self.logger.setLevel(TRACE_LEVEL_NUM)

    def _configure_handlers(self):
        fmt = logging.Formatter("%(message)s")

        # stdout handler for TRACE → INFO
        h_out = logging.StreamHandler(sys.stdout)
        h_out.setLevel(TRACE_LEVEL_NUM)
        h_out.addFilter(MaxLevelFilter(logging.INFO))
        h_out.setFormatter(fmt)
        self.logger.addHandler(h_out)

        # stderr handler for WARNING → CRITICAL
        h_err = logging.StreamHandler(sys.stderr)
        h_err.setLevel(logging.WARNING)
        h_err.addFilter(MinLevelFilter(logging.WARNING))
        h_err.setFormatter(fmt)
        self.logger.addHandler(h_err)

    def _get_ansi_label(self, lvl):
        bg_r, bg_g, bg_b = hex_to_rgb(lvl["label"]["bgColor"])
        fg_r, fg_g, fg_b = hex_to_rgb(lvl["label"]["color"])
        esc = "\033["
        bg_code = f"{esc}48;2;{bg_r};{bg_g};{bg_b}m"
        fg_code = f"{esc}38;2;{fg_r};{fg_g};{fg_b}m"
        bold_code = f"{esc}1m"
        reset_code = f"{esc}0m"

        def wrap(text):
            return f"{bg_code}{fg_code}{bold_code}{text}{reset_code}"

        return wrap

    def _build_message(self, lvl, *args):
        whitespace = " " if len(lvl["name"]) == 4 else ""
        label_fn = self._get_ansi_label(lvl)
        log_label = label_fn(f"[{lvl['name']}]")
        now = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
        padded_name = settings.app_name.ljust(APP_LOG_ID_WIDTH)
        parts = [whitespace + log_label, now, "-", padded_name + ":"]
        parts.extend(str(a) for a in args)
        return parts

    def _send_to_server(self, msg_str):
        if not settings.logging_server:
            return
        data = msg_str.encode("utf-8")
        req = urllib.request.Request(
            settings.logging_server, data=data, method="POST"
        )
        try:
            urllib.request.urlopen(req, timeout=2)
        except Exception:
            pass

    def _map_to_python_level(self, lvl_name):
        return {
            "FATAL": logging.CRITICAL,
            "ERROR": logging.ERROR,
            "WARN": logging.WARNING,
            "INFO": logging.INFO,
            "DEBUG": logging.DEBUG,
            "TRACE": TRACE_LEVEL_NUM,
        }[lvl_name]

    def _log(self, lvl, *args):
        # JS‐style threshold
        if settings.log_level > lvl["level"]:
            return

        parts = self._build_message(lvl, *args)
        msg_str = " ".join(parts)

        # fire‐and‐forget to HTTP server
        self._send_to_server(msg_str)

        py_level = self._map_to_python_level(lvl["name"])
        # emit via python logging
        # we pass msg_str as the “message”; no params
        self.logger.log(py_level, msg_str)

    def fatal(self, *args):
        self._log(LogLevels["fatal"], *args)

    def error(self, *args):
        self._log(LogLevels["error"], *args)

    def warn(self, *args):
        self._log(LogLevels["warn"], *args)

    def info(self, *args):
        self._log(LogLevels["info"], *args)

    def debug(self, *args):
        self._log(LogLevels["debug"], *args)

    def trace(self, *args):
        self._log(LogLevels["trace"], *args)


logger = Logger()

# --- Example ------------------------------------------------------------------

# logger = Logger()
# logger.info("Starting up", {"foo": "bar"})
# logger.warn("This is a warning")
# logger.error("Something broke!")
# logger.trace("Detailed trace here")