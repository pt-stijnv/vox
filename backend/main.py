from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

import config
from routes import upload, dubbing, glossary, music

app = FastAPI()

# Enable CORS to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (e.g., dubbed videos)
app.mount("/static", StaticFiles(directory=config.STATIC_DIR), name="static")

# Include routers from the routes module
app.include_router(upload.router)
app.include_router(dubbing.router)
app.include_router(glossary.router)
app.include_router(music.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
