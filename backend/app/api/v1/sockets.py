from urllib.parse import parse_qs
from datetime import datetime, timezone

import socketio

from app.core import schemas
from app.core.logger import logger
from app.core.auth import socket_auth
from app.core.config import get_settings
from app.core.sockets import socket_namespace, socket_event, socket_publish
from app.api.v1.state import Interval, state, init_state, clear_state, State

settings = get_settings()


@socket_namespace("/v1")
class SocketV1Namespace(socketio.AsyncNamespace):
    rooms = {}

    @socket_auth
    async def on_connect(self, sid, environ, _auth):
        room = parse_qs(environ["QUERY_STRING"])["room"][0]
        await self.enter_room(sid, room)
        self.rooms[sid] = room
        init_state(room)

    async def on_disconnect(self, sid: str, _reason):
        room = self.rooms[sid]
        if len([x for x in self.rooms.values() if x == room]) == 0:
            clear_state(room)

    @socket_event("get_state", response=dict, ack=True, key_builder=lambda: {}, cache_enabled=True)
    async def on_get_state(self, sid: str):
        return state.get(self.rooms.get(sid, "MISSING"), State()).to_dict()

    async def _emit_on_tick(self, sid: str):
        state_ = state[self.rooms[sid]]
        data = schemas.TickPayload(timestamp=datetime.now(tz=timezone.utc))
        await self.emit("tick", data.model_dump(), room=self.rooms[sid])

    @socket_publish("tick", payload=schemas.TickPayload)
    @socket_event("start", response_event="start")
    async def on_start(self, sid: str):
        if state[self.rooms[sid]].status == "running":
            return
        state[self.rooms[sid]].status = "running"
        if state[self.rooms[sid]].interval is None:
            state[self.rooms[sid]].interval = Interval(action=lambda: state[self.rooms[sid]].on_tick(lambda: self._emit_on_tick(sid)),
                                                       interval=settings.interval)

    @socket_event("stop", response_event="stop")
    async def on_stop(self, sid: str):
        if state[self.rooms[sid]].status == "stopped":
            return

        state[self.rooms[sid]].status = "stopped"
        if state[self.rooms[sid]].interval is not None:
            state[self.rooms[sid]].interval.cancel()

    @socket_event("reset", response_event="reset")
    async def on_reset(self, sid: str):
        state[self.rooms[sid]].reset()


def configure_v1_namespace():
    logger.info("Configured V1 namespace")