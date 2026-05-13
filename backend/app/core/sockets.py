import json
import time
import inspect
from pathlib import Path
from types import UnionType
from typing import Any, Dict, Optional, Type, Union, get_origin, get_args, Callable, Literal

import socketio
from fastapi import FastAPI
from fastapi_cache import FastAPICache
from pydantic import BaseModel, ValidationError
from prometheus_client import Counter, Gauge, Histogram

from app.core.logger import logger
from app.core.config import get_settings

settings = get_settings()
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins=[])
sio_app = socketio.ASGIApp(sio, socketio_path=f"{settings.base_path}/ws/socket.io")

active_connections = Gauge("socket_active_connections", "Current number of active socket.io connections")
event_counter = Counter("socket_events_total", "Total number of socket.io events processed", ["event"])
event_duration = Histogram("socket_event_duration_seconds", "Duration of socket.io event handlers in seconds",
                           ["event"], buckets=[0.001, 0.01, 0.1, 1, 5])

_registry: Dict[str, Any] = {}


@sio.event
async def connect(_sid, _environ):
    active_connections.inc()


@sio.event
async def disconnect(_sid):
    active_connections.dec()


def _schema_of(t: Optional[Union[Type[BaseModel], Type, UnionType]], base_path: str | None = None) -> Dict[str, Any] | list[Dict[str, Any]]:
    if t is type(None):
        return {"type": "null"}
    if get_origin(t) is UnionType:
        return {"oneOf": [_schema_of(tt) for tt in get_args(t)]}
    if get_origin(t) is Literal:
        values = get_args(t)
        if not values:
            raise ValueError("Literal must have at least one argument")

        # Infer JSON Schema "type" from the Python types used in the Literal
        py_types = {type(v) for v in values}
        if len(py_types) > 1:
            raise ValueError("Mixed-type Literals not supported")

        python_type = py_types.pop()
        mapping = {
            str: "string",
            int: "integer",
            float: "number",
            bool: "boolean",
            type(None): "null",
        }
        json_type = mapping.get(python_type)
        if json_type is None:
            raise ValueError(f"Cannot map Python type {python_type} to JSON Schema type")

        return {
            "type": json_type,
            "enum": list(values),
        }
    if inspect.isclass(t) and issubclass(t, BaseModel):
        return t.model_json_schema(ref_template=f"{base_path or "#/$defs"}/")
    if t is int:
        return {"type": "integer"}
    if t is str:
        return {"type": "string"}
    if t is dict:
        return {"type": "object"}
    if t is bool:
        return {"type": "boolean"}
    raise ValueError(f"Unsupported schema type: {t}")


def socket_namespace(path: str):
    def decorator(cls: Type[socketio.Namespace]):
        events: Dict[str, Any] = {}
        publishes: Dict[str, Any] = {}
        # wrap all @socket_event methods
        for _, method in inspect.getmembers(cls, inspect.isfunction):
            meta = getattr(method, "_socket_event", None)
            if meta:
                (
                    event_name,
                    payload,
                    response,
                    response_event,
                    ack,
                    key_builder,
                    cache_enabled,
                ) = meta

                def make_wrapper(fn, event_name_, payload_, response_, response_event_,
                                 ack_, key_builder_, cache_enabled_):
                    async def wrapper(self, sid, data=None):
                        event_counter.labels(event=event_name_).inc()
                        start = time.monotonic()
                        try:
                            try:
                                parsed = data
                                if payload_:
                                    if inspect.isclass(payload_) and \
                                            issubclass(payload_, BaseModel):
                                        parsed = payload_.model_validate(data)
                                    else:
                                        if not isinstance(data, payload_):
                                            raise TypeError(
                                                f"Expected {payload_}, got {type(data)}"
                                            )
                                        parsed = data
                            except (ValidationError, TypeError) as e:
                                return await self.emit("error", {"error": str(e)},
                                                       room=sid)

                            if cache_enabled_ and settings.cache_enabled:
                                backend = FastAPICache.get_backend()
                                key = event_name_ + ((":", json.dumps(parsed)) if parsed is not None else "") + ((":"
                                                                                                                  + json.dumps(
                                            key_builder_(), sort_keys=True, default=str)))
                                cached_ = await backend.get(key)
                                if cached_ is not None:
                                    result = json.loads(cached_.decode("utf-8"))
                                else:
                                    if parsed is not None:
                                        result = await fn(self, sid, parsed)
                                    else:
                                        result = await fn(self, sid)
                                    await backend.set(key, json.dumps(result).encode("utf-8"), settings.cache_expiration)
                            else:
                                if parsed is not None:
                                    result = await fn(self, sid, parsed)
                                else:
                                    result = await fn(self, sid)

                            if response_ or response_event_ is not None:
                                try:
                                    out = result
                                    if inspect.isclass(response_) and \
                                            issubclass(response_, BaseModel):
                                        validated = response_.model_validate(out)
                                        payload_out = validated.model_dump()
                                    elif response_ is None:
                                        payload_out = None
                                    else:
                                        if not isinstance(out, response_):
                                            raise TypeError(
                                                f"Expected {response_}, got {type(out)}"
                                            )
                                        payload_out = out

                                    if ack_:
                                        return payload_out
                                    elif response_event_:
                                        if self.rooms.get(sid, None) is not None:
                                            await self.emit(response_event_,
                                                            payload_out, room=self.rooms[sid])
                                        else:
                                            await self.emit(response_event_,
                                                            payload_out,
                                                            room=sid)

                                except (ValidationError, TypeError) as e:
                                    await self.emit("error", {"error": str(e)},
                                                    room=sid)
                        finally:
                            event_duration.labels(event=event_name).observe(time.monotonic() - start)

                    return wrapper

                setattr(
                    cls,
                    method.__name__,
                    make_wrapper(method, event_name, payload, response, response_event,
                                 ack, key_builder, cache_enabled),
                )

                events[event_name] = {
                    "payload": payload,
                    "response": response,
                    "response_event": response_event,
                    "ack": ack,
                    "key_builder": key_builder,
                    "cache_enabled": cache_enabled,
                }

            pubs = getattr(method, "_socket_publish", None)
            if pubs:
                for (name, payload) in pubs:
                    publishes[name] = {
                        "payload": payload,
                    }

        instance = cls(path)
        sio.register_namespace(instance)
        _registry[path] = {"events": events, "publishes": publishes}
        return cls

    return decorator


def socket_publish(
    name: str,
    payload: Optional[Union[Type[BaseModel], Type, UnionType]] = None,
):
    """
    Declare a server→client event that you will emit “by hand”
    (i.e. via self.emit(...) somewhere in your code).
    """
    def decorator(fn):
        # allow multiple publishes on one method
        lst: list[Any] = getattr(fn, "_socket_publish", [])
        lst.append((name, payload))
        setattr(fn, "_socket_publish", lst)
        return fn
    return decorator


def socket_event(
        name: str,
        payload: Optional[Union[Type[BaseModel], Type, UnionType]] = None,
        response: Optional[Union[Type[BaseModel], Type, UnionType]] = None,
        response_event: Optional[str] = None,
        *,
        ack: bool = False,
        key_builder: Optional[Callable] = None,
        cache_enabled: Optional[bool] = False,
):
    """
    - name: incoming event
    - payload: Pydantic or primitive
    - response: Pydantic or primitive
    - response_event: where to emit the response
    - ack: if True, return the validated response so python-sio
                will send it via the client's callback
    - key_builder: a callable that returns additional data as a dict for the cache key
    - cache_prefix: a string that will be prefixed to the cache key
    - cache_enabled: whether to enable caching on this event
    """

    def decorator(fn):
        setattr(fn, "_socket_event",
                (name, payload, response, response_event,
                ack, key_builder, cache_enabled))
        return fn

    return decorator


def generate_asyncapi(outfile: Path, title="", version="", url=""):
    for ns, info in _registry.items():
        spec = {
            "asyncapi": "3.0.0",
            "info": {"title": title, "version": version},
            "servers": {"prod": {"host": url,
                                 "protocol": "ws"}},
            "channels": {},
            "operations": {},
        }
        for evt, m in info["events"].items():
            chan = spec["channels"].get(evt, {})
            response_chan = None
            chan["address"] = evt
            chan["messages"] = {}
            if m["payload"]:
                chan["messages"]["receive"] = {
                    "contentType": "application/json",
                    "payload": _schema_of(m["payload"], base_path=f"#/channels/{evt}/messages/receive/payload/$defs")
                }
                spec["operations"][f"{evt}.receive"] = {
                    "action": "receive",
                    "channel": {
                        "$ref": f"#/channels/{evt}"
                    },
                    "messages": [
                        {
                            "$ref": f"#/channels/{evt}/messages/receive"
                        }
                    ]
                }
            else:
                chan["messages"]["receive"] = {}
                spec["operations"][f"{evt}.receive"] = {
                    "action": "receive",
                    "channel": {
                        "$ref": f"#/channels/{evt}"
                    },
                    "messages": [
                        {
                            "$ref": f"#/channels/{evt}/messages/receive"
                        }
                    ]
                }
            if m["ack"]:
                chan["messages"]["send"] = {
                    "contentType": "application/json",
                    "payload": _schema_of(m["response"], base_path=f"#/channels/{evt}/messages/send/payload/$defs"),
                }
                spec["operations"][f"{evt}.send"] = {
                    "action": "send",
                    "channel": {
                        "$ref": f"#/channels/{evt}"
                    },
                    "messages": [
                        {
                            "$ref": f"#/channels/{evt}/messages/send"
                        }
                    ],
                    "bindings": {
                        "x-socketio": {
                            "ack": True
                        }
                    }
                }

            if (m["response"] or m["response_event"]) and not m["ack"]:
                response_chan = spec["channels"].get(m["response_event"], {}) if m["response_event"] != evt else chan
                if m["response_event"] != evt:
                    response_chan["address"] = m["response_event"]
                    response_chan["messages"] = {}
                if m["response"]:
                    response_chan["messages"]["send"] = {
                        "contentType": "application/json",
                        "payload": _schema_of(m["response"], base_path=f"#/channels/{m["response_event"]}/messages/send/payload/$defs"),
                    }
                else:
                    response_chan["messages"]["send"] = {}
                spec["operations"][f"{m["response_event"]}.send"] = {
                    "action": "send",
                    "channel": {
                        "$ref": f"#/channels/{m["response_event"]}"
                    },
                    "messages": [
                        {
                            "$ref": f"#/channels/{m["response_event"]}/messages/send"
                        }
                    ]
                }
            spec["channels"][evt] = chan
            if response_chan is not None and m["response_event"] != evt:
                spec["channels"][m["response_event"]] = response_chan

        for evt, m in info["publishes"].items():
            chan = spec["channels"].get(evt, {})
            chan["address"] = evt
            chan["messages"] = chan.get("messages", {})
            chan["messages"]["send"] = {
                "contentType": "application/json",
                "payload": _schema_of(m["payload"], f"#/channels/{evt}/messages/send/payload/$defs"),
            } if m["payload"] else {}
            spec["operations"][f"{evt}.send"] = {
                "action": "send",
                "channel": {
                    "$ref": f"#/channels/{evt}"
                },
                "messages": [
                    {
                        "$ref": f"#/channels/{evt}/messages/send"
                    }
                ]
            }
            spec["channels"][evt] = chan
        (outfile / f"{ns.replace('/', '')}.json").write_text(json.dumps(spec, indent=2, sort_keys=False))


def configure_sockets(app: FastAPI):
    app.mount(f"/ws/socket.io", sio_app)
    logger.info("Sockets configured")