import time
import asyncio
import threading
from dataclasses import dataclass
from datetime import datetime, timezone


class Interval:
    def __init__(self, action, interval):
        self.interval = interval
        self.action = action
        self.stopEvent = threading.Event()
        thread = threading.Thread(target=self._set_interval)
        thread.start()

    def _set_interval(self):
        next_time = time.time() + self.interval
        while not self.stopEvent.wait(next_time - time.time()):
            next_time += self.interval
            asyncio.run(self.action())

    def cancel(self):
        self.stopEvent.set()


@dataclass
class State:
    interval: Interval | None = None
    status: str = "stopped"
    tick: int = 0
    timestamp: datetime = None

    async def on_tick(self, emitter):
        self.tick += 1
        await emitter()

    def reset(self):
        self.tick = 0
        self.interval = None
        self.status = "stopped"
        self.timestamp = datetime.now(tz=timezone.utc)

    def to_dict(self):
        return {
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
        }


state: dict[str, State] = {}


def init_state(room: str):
    global state
    if room in state:
        return
    state[room] = State(timestamp=datetime.now(tz=timezone.utc))


def clear_state(room: str):
    global state
    if room not in state:
        return
    del state[room]