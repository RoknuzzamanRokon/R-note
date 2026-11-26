"""Start the API:  python run.py   (add --reload while developing)"""

import sys

import uvicorn

from app import config

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=config.HOST,
        port=config.PORT,
        reload="--reload" in sys.argv,
        proxy_headers=True,
    )
