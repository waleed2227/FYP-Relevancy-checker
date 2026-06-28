"""Global exception handlers for user-friendly API errors."""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def _format_validation_errors(errors: list) -> str:
    messages = []
    for err in errors:
        loc = err.get("loc", ())
        field = loc[-1] if loc else "field"
        msg = err.get("msg", "Invalid value")
        if msg.startswith("Value error, "):
            msg = msg.replace("Value error, ", "")
        messages.append(f"{field}: {msg}")
    return "; ".join(messages) if messages else "Validation failed"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": _format_validation_errors(exc.errors())},
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail = exc.detail
        if isinstance(detail, list):
            detail = _format_validation_errors(detail)
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": detail},
        )
