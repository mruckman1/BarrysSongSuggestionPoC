# backend/spotify.py
import os
import httpx
import base64
import logging
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables from .env file if not already loaded
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Spotify API configuration
CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE_URL = "https://api.spotify.com/v1"

if not CLIENT_ID or not CLIENT_SECRET:
    logger.error("SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in environment variables.")
    # Depending on requirements, you might want to raise an exception here
    # raise ValueError("Spotify API credentials not configured.")

# Token cache (simple in-memory cache)
token_info = {"access_token": None, "expires_at": None}

async def get_token():
    """Gets a Spotify API token using Client Credentials Flow."""
    global token_info
    now = datetime.now()

    if token_info.get("access_token") and token_info.get("expires_at") and now < token_info["expires_at"]:
        return token_info["access_token"]

    if not CLIENT_ID or not CLIENT_SECRET:
         logger.error("Cannot get token, Spotify credentials missing.")
         return None # Or raise an exception

    auth_string = f"{CLIENT_ID}:{CLIENT_SECRET}"
    auth_bytes = auth_string.encode("ascii")
    auth_base64 = base64.b64encode(auth_bytes).decode("ascii")

    headers = {
        "Authorization": f"Basic {auth_base64}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    try:
        async with httpx.AsyncClient() as client:
            logger.info("Requesting new Spotify API token...")
            response = await client.post(TOKEN_URL, headers=headers, data=data)
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            response_data = response.json()

            token_info["access_token"] = response_data["access_token"]
            # Subtract 60 seconds buffer for expiry
            expires_in = response_data.get("expires_in", 3600)
            token_info["expires_at"] = now + timedelta(seconds=expires_in - 60)
            logger.info("Successfully obtained new Spotify API token.")
            return token_info["access_token"]
    except httpx.RequestError as exc:
        logger.error(f"An error occurred while requesting Spotify token {exc.request.url!r}: {exc}")
        return None
    except httpx.HTTPStatusError as exc:
        logger.error(f"Error response {exc.response.status_code} while requesting Spotify token: {exc.response.text}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during token fetch: {e}")
        return None


async def search_spotify(query: str, limit: int = 10):
    """Searches Spotify for tracks matching the query."""
    token = await get_token()
    if not token:
        logger.error("Failed to search Spotify: Could not get API token.")
        return None # Indicate failure

    headers = {"Authorization": f"Bearer {token}"}
    params = {"q": query, "type": "track", "limit": limit}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{API_BASE_URL}/search", headers=headers, params=params)
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as exc:
        logger.error(f"An error occurred while searching Spotify {exc.request.url!r}: {exc}")
        return None
    except httpx.HTTPStatusError as exc:
        logger.error(f"Error response {exc.response.status_code} while searching Spotify: {exc.response.text}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during Spotify search: {e}")
        return None

async def get_track_details(track_uri: str):
    """Gets details for a specific Spotify track URI."""
    token = await get_token()
    if not token:
        logger.error("Failed to get track details: Could not get API token.")
        return None

    headers = {"Authorization": f"Bearer {token}"}
    try:
        track_id = track_uri.split(":")[-1]
    except IndexError:
        logger.error(f"Invalid track URI format: {track_uri}")
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{API_BASE_URL}/tracks/{track_id}", headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.RequestError as exc:
        logger.error(f"An error occurred while getting track details {exc.request.url!r}: {exc}")
        return None
    except httpx.HTTPStatusError as exc:
        logger.error(f"Error response {exc.response.status_code} while getting track details: {exc.response.text}")
        return None
    except Exception as e:
        logger.error(f"An unexpected error occurred during track details fetch: {e}")
        return None
