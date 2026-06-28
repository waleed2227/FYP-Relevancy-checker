"""
Run the API server (development).
Usage: python run.py
"""

import uvicorn

from app.config.settings import get_settings

if __name__ == "__main__":
    s = get_settings()
    uvicorn.run(
        "app.main:app",
        host=s.host,
        port=s.port,
        reload=s.debug and not s.is_production,
    )
