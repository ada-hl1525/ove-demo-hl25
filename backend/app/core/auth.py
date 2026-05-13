import functools
from uuid import uuid4
from typing import Annotated
from http.cookies import SimpleCookie

from pydantic import BaseModel
from starlette.responses import RedirectResponse
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import APIKeyCookie, APIKeyQuery, HTTPAuthorizationCredentials, HTTPBearer, HTTPBasic, \
    HTTPBasicCredentials

from app.app import app
from app.db.models import APIKey
from app.core.state import state
from app.core.logger import logger
from app.core.config import get_settings
from app.db.session import get_db, AsyncSession

settings = get_settings()

base_cookie_scheme = APIKeyCookie(name="session")
query_scheme = APIKeyQuery(name="security_token")
api_key_scheme = HTTPBearer()
basic_scheme = HTTPBasic()


class RedirectOptions(BaseModel):
    security_token: str
    to: str


def metrics_scheme(user: HTTPBasicCredentials = Depends(basic_scheme)):
    if settings.protect_metrics and (
            user.username != settings.metrics_username or user.password != settings.metrics_password):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
        )


def cookie_scheme(cookie: str = Depends(base_cookie_scheme)):
    if cookie not in state.cookies:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


def otp_scheme(token: str = Depends(query_scheme)):
    if settings.use_legacy_auth and token != settings.legacy_auth_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Invalid token: {token}",
        )
    elif not settings.use_legacy_auth:
        if token in state.tokens:
            state.tokens.remove(token)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid token: {token}",
            )
    return token


def _get_token_from_environ(environ: dict) -> str | None:
    # ASGIApp passes the scope in environ under "asgi.scope"
    scope = environ.get("asgi.scope", {})
    headers = scope.get("headers", [])
    cookie_header = next(
        (v.decode() for k, v in headers if k == b"cookie"), ""
    )
    cookie = SimpleCookie()
    cookie.load(cookie_header)
    morsel = cookie.get("session")
    return morsel.value if morsel else None


async def authenticate(environ):
    token = _get_token_from_environ(environ)
    if not token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token")


def socket_auth(func):
    @functools.wraps(func)
    async def wrapper(self, sid, environ, *args, **kwargs):
        # await the original authenticate
        if settings.disable_auth:
            auth = None
        else:
            auth = await authenticate(environ)
        # call the underlying method, injecting `auth`
        return await func(self, sid, environ, auth, *args, **kwargs)

    return wrapper


@app.get("/auth/validate", response_model=bool)
def validate_token(_cookie: str = Depends(cookie_scheme)):
    return True


@app.get("/auth/redirect")
def redirect(options: Annotated[RedirectOptions, Query()], _token: str = Depends(otp_scheme)):
    response = RedirectResponse(
        url=options.to,
    )

    token = uuid4().hex
    state.cookies.add(token)
    response.set_cookie("session", token, httponly=True, samesite="lax", secure=True, max_age=settings.token_expiry)

    return response


@app.get("/auth/token")
async def get_token(credentials: Annotated[HTTPAuthorizationCredentials, Depends(api_key_scheme)],
                    db: AsyncSession = Depends(get_db)):
    if settings.disable_auth:
        return "DISABLED"
    if await db.get(APIKey, credentials.credentials) is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
        )

    token = uuid4().hex
    state.tokens.add(token)
    return token


def override_metrics_schema():
    pass


def override_cookie_scheme():
    pass


def override_otp_scheme():
    return "DISABLED"


def override_api_key_scheme():
    return None


def configure_auth():
    if settings.disable_auth:
        app.dependency_overrides[metrics_scheme] = override_metrics_schema
        app.dependency_overrides[cookie_scheme] = override_cookie_scheme
        app.dependency_overrides[otp_scheme] = override_otp_scheme
        app.dependency_overrides[api_key_scheme] = override_api_key_scheme
        logger.info("Auth disabled")
    else:
        logger.info("Auth configured")