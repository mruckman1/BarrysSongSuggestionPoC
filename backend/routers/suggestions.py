# backend/routers/suggestions.py
import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Body, Query, Path
from datetime import datetime
from bson import ObjectId # For checking valid ID format and converting string path param
from motor.motor_asyncio import AsyncIOMotorCollection

# Use direct imports from sibling modules/files
from database import get_suggestions_collection, get_quotas_collection
from models import (
    SongSuggestionCreate,
    SongSuggestionInDB,
    SongSuggestionUpdateStatus,
    PyObjectId # Import the helper
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Define the mock user/instructor IDs used in the frontend App.tsx
MOCK_PARTICIPANT_ID = "user123"
MOCK_INSTRUCTOR_ID = "instructor456" # Assuming this is constant for PoC class association
MOCK_CLASS_ID_FOR_DEMO = "class789" # Assuming suggestions are for this class in PoC

@router.post(
    "/",
    response_model=SongSuggestionInDB,
    status_code=201,
    summary="Submit a new song suggestion",
    description="Creates a new song suggestion if the user has quota remaining."
)
async def create_suggestion(
    suggestion_data: SongSuggestionCreate = Body(...),
    suggestions_coll: AsyncIOMotorCollection = Depends(get_suggestions_collection),
    quotas_coll: AsyncIOMotorCollection = Depends(get_quotas_collection)
) -> SongSuggestionInDB:

    # --- PoC Simplification: Use hardcoded participant ID ---
    participant_id = MOCK_PARTICIPANT_ID
    logger.info(f"Received suggestion from participant (mocked): {participant_id} for class {suggestion_data.class_id}")

    # --- Quota Check ---
    current_month_year = datetime.utcnow().strftime("%Y-%m")
    quota_filter = {"user_id": participant_id, "month_year": current_month_year}
    quota_record = await quotas_coll.find_one(quota_filter)

    if not quota_record or quota_record.get("remaining_quota", 0) <= 0:
        logger.warning(f"Quota exceeded or not found for user {participant_id} for {current_month_year}.")
        raise HTTPException(status_code=403, detail="No suggestion quota remaining for this month.")

    logger.info(f"User {participant_id} has {quota_record.get('remaining_quota')} suggestions remaining.")

    # --- Create Suggestion Document ---
    # PoC Simplification: Use hardcoded instructor ID based on class or just mock ID
    instructor_id = MOCK_INSTRUCTOR_ID # In reality, look this up based on suggestion_data.class_id

    suggestion_doc = SongSuggestionInDB(
        participant_id=participant_id,
        instructor_id=instructor_id, # Hardcoded for PoC
        suggestion_date=datetime.utcnow(),
        status='pending',
        # Spread data from the input model
        **suggestion_data.dict()
    )

    # --- Insert into DB ---
    try:
        insert_result = await suggestions_coll.insert_one(suggestion_doc.dict(by_alias=True)) # Use by_alias for _id
        if not insert_result.acknowledged or not insert_result.inserted_id:
             raise Exception("Failed to insert suggestion into database.")
        logger.info(f"Suggestion {insert_result.inserted_id} created successfully.")

        # --- Decrement Quota ---
        update_result = await quotas_coll.update_one(
            quota_filter,
            {"$inc": {"remaining_quota": -1}}
        )
        if update_result.modified_count != 1:
            # This is problematic - suggestion created but quota not decremented. Log error.
            # In production, might need compensation logic (e.g., delete suggestion or retry quota update)
            logger.error(f"CRITICAL: Failed to decrement quota for user {participant_id} after creating suggestion {insert_result.inserted_id}")
            # Proceed for PoC, but flag this as important
        else:
             logger.info(f"Decremented quota for user {participant_id}. Remaining: {quota_record.get('remaining_quota') - 1}")


        # Fetch the created document to return it with the generated ID
        created_suggestion = await suggestions_coll.find_one({"_id": insert_result.inserted_id})
        if created_suggestion:
             # Use ** to unpack dict into the Pydantic model for validation and response
            return SongSuggestionInDB(**created_suggestion)
        else:
             # Should not happen if insert succeeded, but handle defensively
             logger.error(f"Failed to fetch created suggestion {insert_result.inserted_id} after insert.")
             raise HTTPException(status_code=500, detail="Suggestion created but could not be retrieved.")

    except Exception as e:
        logger.exception(f"Error creating suggestion or decrementing quota: {e}")
        raise HTTPException(status_code=500, detail="Failed to save suggestion.")


@router.get(
    "/",
    response_model=List[SongSuggestionInDB],
    summary="Get song suggestions",
    description="Retrieves a list of suggestions, optionally filtered."
)
async def get_suggestions(
    instructor_id: Optional[str] = Query(None, description="Filter by instructor ID"),
    class_id: Optional[str] = Query(None, description="Filter by class ID"),
    status: Optional[str] = Query(None, description="Filter by status (pending, approved, rejected)"),
    suggestions_coll: AsyncIOMotorCollection = Depends(get_suggestions_collection)
) -> List[SongSuggestionInDB]:
    query_filter = {}
    if instructor_id:
        query_filter["instructor_id"] = instructor_id
    if class_id:
        query_filter["class_id"] = class_id
    if status and status in ['pending', 'approved', 'rejected']:
        query_filter["status"] = status

    logger.info(f"Fetching suggestions with filter: {query_filter}")
    suggestions_cursor = suggestions_coll.find(query_filter).sort("suggestion_date", -1) # Sort newest first
    suggestions_list = await suggestions_cursor.to_list(length=100) # Limit length for safety

    # Convert MongoDB docs to Pydantic models for response validation
    # Pydantic V2 handles the alias automatically if configured in model
    # Pydantic V1 might need manual mapping or `parse_obj_as`
    return [SongSuggestionInDB(**s) for s in suggestions_list]


@router.patch(
    "/{suggestion_id}",
    response_model=SongSuggestionInDB,
    summary="Update suggestion status",
    description="Updates the status of a specific suggestion (Approve/Reject)."
)
async def update_suggestion_status(
    suggestion_id: str = Path(..., description="The ID of the suggestion to update"),
    status_update: SongSuggestionUpdateStatus = Body(...),
    suggestions_coll: AsyncIOMotorCollection = Depends(get_suggestions_collection)
) -> SongSuggestionInDB:

    # Validate input ID format before hitting DB
    try:
        obj_id = PyObjectId(suggestion_id)
    except Exception:
         raise HTTPException(status_code=400, detail=f"Invalid suggestion ID format: {suggestion_id}")

    logger.info(f"Attempting to update suggestion {suggestion_id} to status {status_update.status}")

    update_result = await suggestions_coll.find_one_and_update(
        {"_id": obj_id},
        {"$set": {"status": status_update.status}},
        return_document=True # Return the updated document
    )

    if update_result:
        logger.info(f"Suggestion {suggestion_id} updated successfully.")
        return SongSuggestionInDB(**update_result) # Return validated updated doc
    else:
        logger.warning(f"Suggestion {suggestion_id} not found for update.")
        raise HTTPException(status_code=404, detail=f"Suggestion with ID {suggestion_id} not found")
