# backend/app.py
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from routers import suggestions, quotas, spotify_search

load_dotenv()

# --- Use direct imports since all modules are in /app within the container ---
from database import connect_to_mongo, close_mongo_connection # Reverted
from routers import suggestions, quotas, spotify_search       # Reverted
# --- End Import Change ---

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Lifespan Management ---

# (Keep the lifespan function as it was in the previous correct version)
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup...")
    # Store client on app state for potential use in health check etc.
    mongo_client_instance = await connect_to_mongo() # Get the client from connect
    if mongo_client_instance:
        app.state.mongodb_client = mongo_client_instance
        logger.info("MongoDB client stored in app state.")
    else:
        app.state.mongodb_client = None
        logger.warning("MongoDB client connection failed, not stored in app state.")
    yield
    logger.info("Application shutdown...")
    # Pass the client instance if close_mongo_connection expects it
    await close_mongo_connection(getattr(app.state, 'mongodb_client', None))

# --- FastAPI App Instance ---
app = FastAPI(
    title="Barry's Bootcamp Song Suggestion API - POC",
    description="API for suggesting songs for classes and managing suggestions.",
    version="0.1.0",
    lifespan=lifespan
)

# --- CORS Configuration ---
# (Keep CORS config as is)
origins = [
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", None),
]
origins = [origin for origin in origins if origin]
if not origins:
    logger.warning("No CORS origins specified. Defaulting to http://localhost:3000")
    origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
# (Keep routers included with prefixes)
app.include_router(spotify_search.router, prefix="/spotify", tags=["Spotify"]) # Prefix is important!
app.include_router(suggestions.router, prefix="/suggestions", tags=["Suggestions"])
app.include_router(quotas.router, prefix="/quota", tags=["Quota"])

# --- Root and Health Endpoints ---
# (Keep root and health check endpoints as is)
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to Barry's Song Suggestion API - POC"}

@app.get("/health", tags=["Health"])
async def health_check():
    db_status = "disconnected"
    mongo_client = getattr(app.state, 'mongodb_client', None)
    try:
        if mongo_client:
             # The ismaster command is cheap and does not require auth.
             await mongo_client.admin.command('ismaster')
             db_status = "connected"
        else:
             # Attempt a quick connection check if client wasn't on state during startup
             # This part might be less reliable, depends on connect_to_mongo logic
             logger.info("Health check: No client in state, attempting transient connection.")
             temp_client = await connect_to_mongo() # Assumes connect_to_mongo returns the client
             if temp_client:
                 await temp_client.admin.command('ismaster')
                 db_status = "connected_transiently"
                 await close_mongo_connection(temp_client) # Close the temporary connection
             else:
                db_status = "connection_failed"

    except Exception as e:
        logger.error(f"Health check DB connection failed: {e}")
        db_status = "error"

    return {"status": "ok", "database_status": db_status}