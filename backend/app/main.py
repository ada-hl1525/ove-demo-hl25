import json
import csv
import os
from typing import List, Optional
from pathlib import Path
from contextlib import asynccontextmanager

import uvicorn
from fastapi.routing import APIRoute
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import Request, FastAPI, Response, HTTPException, Query
from pydantic import BaseModel

from app.app import app
from app.db import configure_db
from app.core.auth import configure_auth
from app.core.config import get_settings
from app.core.cors import configure_cors
from app.core import schemas, downgrade_ssl
from app.core.metrics import configure_metrics
from app.core.schemas import configure_schemas
from app.core.sockets import configure_sockets
from app.core.templates import configure_templates
from app.api.v1.sockets import configure_v1_namespace
from app.core.rate_limiter import limiter, configure_limiter

settings = get_settings()

class Ship(BaseModel):
    id: int
    Ship_name: str
    Cruise_line: str
    Age: int
    Tonnage: float
    passengers: float
    length: float
    cabins: float
    passenger_density: float
    crew: float

class ShipDatabase:
    def __init__(self):
        self.data: List[Ship] = []
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.csv_path = os.path.join(current_dir, "..", "data", "cruise_ship_info.csv")

    def load_data(self):
        print(f"🔄 [Backend] Loading data from: {self.csv_path}")
        new_data = []
        try:
            with open(self.csv_path, mode='r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for index, row in enumerate(reader):
                    try:
                        ship = Ship(
                            id=index + 1,
                            Ship_name=row['Ship_name'],
                            Cruise_line=row['Cruise_line'],
                            Age=int(row['Age']),
                            Tonnage=float(row['Tonnage']),
                            passengers=float(row['passengers']),
                            length=float(row['length']),
                            cabins=float(row['cabins']),
                            passenger_density=float(row['passenger_density']),
                            crew=float(row['crew'])
                        )
                        new_data.append(ship)
                    except Exception as e:
                        print(f"⚠️ Skipped row {index}: {e}")
            
            self.data = new_data
            print(f"✅ [Backend] Successfully loaded {len(self.data)} ships.")
        except FileNotFoundError:
            print(f"❌ [Backend] Error: CSV not found at {self.csv_path}")
            self.data = []

    def get_all(self):
        return self.data

    def get_by_id(self, ship_id: int):
        for ship in self.data:
            if ship.id == ship_id:
                return ship
        return None

db = ShipDatabase()

db.load_data()

@app.get("/api/v1/ships", response_model=List[Ship], tags=["ships"])
async def get_ships(
    cruise_line: Optional[str] = Query(None),
    min_passengers: Optional[int] = Query(None)
):
    results = db.get_all()
    if cruise_line and cruise_line != "All Lines":
        results = [s for s in results if s.Cruise_line == cruise_line]
    if min_passengers:
        results = [s for s in results if (s.passengers * 100) >= min_passengers]
    return results

@app.get("/api/v1/ships/{ship_id}", response_model=Ship, tags=["ships"])
async def get_ship_detail(ship_id: int):
    ship = db.get_by_id(ship_id)
    if not ship:
        raise HTTPException(status_code=404, detail="Ship not found")
    return ship

@app.post("/api/v1/refresh", tags=["admin"])
async def refresh_data():
    db.load_data()
    return {"status": "success", "count": len(db.data)}

if settings.downgrade_ssl:
    downgrade_ssl()

configure_limiter()
configure_cors()
configure_metrics()
configure_auth()
configure_db()
configure_schemas()

configure_sockets(app)
configure_templates(app)

configure_v1_namespace()

# Comment out the original router reference to prevent conflicts
# app.include_router(ships.router, prefix=f"/api/v1", tags=["ships"])

# noinspection PyUnusedLocal
@app.get("/status", response_model=schemas.Status)
@limiter.limit("1/second")
async def get_status(request: Request) -> schemas.Status:
    return schemas.Status(status="running")


@app.get("/env.js")
async def get_env(request: Request):
    env = {
        "VITE_APP_TITLE": settings.app_name,
        "VITE_BACKEND": settings.vite_backend,
        "VITE_SOCKET_SERVER": settings.vite_socket_server,
        "VITE_SOCKET_PATH": settings.vite_socket_path,
        "VITE_LOG_LEVEL": settings.log_level,
        "VITE_LOGGING_SERVER": settings.logging_server,
        "VITE_ENABLE_DEBUG": settings.vite_enable_debug,
    }
    payload = "window._env_ = " + json.dumps(env) + ";"
    return Response(payload, media_type="application/javascript")


app.mount("/asyncapi", StaticFiles(directory=settings.asyncapi_dir), name="asyncapi")


@app.get("/{full_path:path}")
async def spa(full_path: str):
    # print(full_path) # Comment out this print to reduce console noise
    file_path = Path(settings.public_dir, full_path)
    if file_path.is_file():
        return FileResponse(file_path)
    index = Path(settings.public_dir, "index.html")
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(status_code=404)


def use_route_names_as_operation_ids(app_: FastAPI) -> None:
    for route in app_.routes:
        if isinstance(route, APIRoute):
            if route.path.startswith("/api/v"):
                try:
                    route.operation_id = route.name + f"_v{route.path.split('/')[2][1:]}"
                except IndexError:
                    route.operation_id = route.name
            else:
                route.operation_id = route.name 


use_route_names_as_operation_ids(app)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=settings.port)