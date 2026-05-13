/* global console, fetch */

import chalk from "chalk";
import { format } from "date-fns/format";
import { env } from "@/env.ts";

type ConstantsType = {
  APP_LOG_ID_WIDTH: number;
  LogLevels: {
    [index: string]: LogLevel;
  };
  RegExp: {
    Annotation: {
      [index: string]: RegExp;
    };
  };
  DEFAULT_LOG_LEVEL: number;
};

const Constants: ConstantsType = {
  APP_LOG_ID_WIDTH: 16,
  RegExp: {
    Annotation: {
      NAME: /@NAME/g,
      APP_NAME: /@APP_NAME/g,
      VERSION: /@VERSION/g,
      LICENSE: /@LICENSE/g,
      AUTHOR: /@AUTHOR/g,
    },
  },
  LogLevels: {
    fatal: {
      name: "FATAL",
      consoleLogger: "error",
      level: 0,
      label: { bgColor: "#FF0000", color: "#FFFFFF" },
    },
    error: {
      name: "ERROR",
      consoleLogger: "error",
      level: 1,
      label: { bgColor: "#B22222", color: "#FFFAF0" },
    },
    warn: {
      name: "WARN",
      consoleLogger: "warn",
      level: 2,
      label: { bgColor: "#DAA520", color: "#FFFFF0" },
    },
    info: {
      name: "INFO",
      consoleLogger: "log",
      level: 3,
      label: { bgColor: "#2E8B57", color: "#FFFAFA" },
    },
    debug: {
      name: "DEBUG",
      consoleLogger: "log",
      level: 4,
      label: { bgColor: "#1E90FF", color: "#F8F8FF" },
    },
    trace: {
      name: "TRACE",
      consoleLogger: "log",
      level: 5,
      label: { bgColor: "#808080", color: "#FFFAF0" },
    },
  },
  DEFAULT_LOG_LEVEL: -1,
};

export type LogLevel = {
  name: string
  consoleLogger: string
  level: number
  label: {
    bgColor: string
    color: string
  }
}

export const Logger = () => {
  const logLevel_ = env.VITE_LOG_LEVEL ?? Constants.DEFAULT_LOG_LEVEL;

  const getLogLabel = (logLevel: LogLevel) => chalk
    .bgHex(logLevel.label.bgColor)
    .hex(logLevel.label.color)
    .bold;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildLogMessage = (logLevel: LogLevel, ...args: any[]): string[] => {
    const whitespace = logLevel.name.length === 4 ? " " : "";
    const logLabel = getLogLabel(logLevel)(`[${logLevel.name}]`);
    const date = format(new Date(), "dd/MM/yyyy, HH:mm:ss");
    const paddedName = env.VITE_APP_TITLE.padEnd(Constants.APP_LOG_ID_WIDTH);
    return [whitespace + logLabel, date, "-", paddedName, ":"]
      .concat(Object.values(args));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const log = (level: LogLevel, ...args: any[]): void => {
    if (logLevel_ > level.level) return;

    const message = buildLogMessage(level, ...args);

    if (env.VITE_LOGGING_SERVER !== undefined && env.VITE_LOGGING_SERVER !== null) {
      // fails silently
      fetch(env.VITE_LOGGING_SERVER, {
        method: "POST",
        body: message.join(" "),
      }).catch();
    }

    switch (level.consoleLogger) {
      case "error":
        console.error(...message);
        break;
      case "warn":
        console.warn(...message);
        break;
      case "info":
        console.info(...message);
        break;
      case "log":
        console.log(...message);
        break;
      case "trace":
        console.trace(...message);
        break;
    }
  };

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fatal: (...args: any[]) => log(Constants.LogLevels["fatal"], ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (...args: any[]) => log(Constants.LogLevels.error, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (...args: any[]) => log(Constants.LogLevels.warn, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (...args: any[]) => log(Constants.LogLevels.info, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (...args: any[]) => log(Constants.LogLevels.debug, ...args),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trace: (...args: any[]) => log(Constants.LogLevels.trace, ...args),
  };
};

export type TLogger = ReturnType<typeof Logger>

export const logger = Logger();