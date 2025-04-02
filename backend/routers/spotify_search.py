# backend/routers/spotify_search.py
import logging
from fastapi import APIRouter, HTTPException, Query, Depends
# Use relative import to access the spotify module functions
# from .. import spotify # <<< PROBLEM LINE
from spotify import search_spotify # <<< CORRECTED IMPORT

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/search")
async def search_tracks(
    q: str = Query(..., min_length=1, description="The search query string.")
):
    """
    Proxies search requests to the Spotify API to find tracks.
    Requires valid SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in the environment.
    """
    logger.info(f"Received Spotify search request for query: '{q}'")

    try:
        # Call the search function using the direct import
        # search_spotify function handles getting the token
        search_results = await search_spotify(query=q, limit=10) # Use imported function directly

        if search_results is None:
            logger.error(f"Spotify search failed for query '{q}'. Check credentials and Spotify service status.")
            raise HTTPException(
                status_code=503,
                detail="Could not connect to Spotify or search failed. Please try again later."
            )

        track_count = len(search_results.get('tracks', {}).get('items', []))
        logger.info(f"Successfully fetched {track_count} tracks from Spotify for query: '{q}'")

        return search_results

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception(f"An unexpected error occurred during Spotify search for query '{q}': {e}")
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred while searching Spotify."
        )