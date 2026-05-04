from fastapi import Request, status
from fastapi.responses import JSONResponse

class APIException(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message

async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal Server Error"},
    )
