# backend/routers/quotas.py
import logging
from fastapi import APIRouter, HTTPException, Depends, Path
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorCollection

# Use direct imports from sibling modules/files
from database import get_quotas_collection
from models import QuotaRecordInDB

router = APIRouter()
logger = logging.getLogger(__name__)

# Define the mock user ID used in the frontend App.tsx
MOCK_USER_ID_FOR_POC = "user123"

@router.get(
    "/{user_id}",
    response_model=QuotaRecordInDB,
    summary="Get current quota for a user",
    description="Retrieves the quota record for the specified user for the current month."
)
async def get_user_quota(
    user_id: str = Path(..., description="The ID of the user to retrieve quota for"),
    quotas_coll: AsyncIOMotorCollection = Depends(get_quotas_collection)
) -> QuotaRecordInDB:
    # For PoC, we primarily care about the hardcoded mock user
    if user_id != MOCK_USER_ID_FOR_POC:
         logger.warning(f"Quota requested for non-mock user: {user_id}. Returning default empty quota.")
         # Return a default record for non-mock users in this PoC phase
         return QuotaRecordInDB(
             user_id=user_id,
             month_year=datetime.utcnow().strftime("%Y-%m"),
             total_quota=0,
             remaining_quota=0
         )

    logger.info(f"Fetching quota for user: {user_id}")
    current_month_year = datetime.utcnow().strftime("%Y-%m")

    quota_record_dict = await quotas_coll.find_one({
        "user_id": user_id,
        "month_year": current_month_year
    })

    if quota_record_dict:
        logger.info(f"Found quota record for {user_id}: {quota_record_dict}")
        # Pydantic automatically handles the _id mapping here if allow_population_by_field_name=True
        return QuotaRecordInDB(**quota_record_dict)
    else:
        # If no record found for the mock user, return a default (or potentially create one - returning default for now)
        logger.warning(f"No quota record found for mock user {user_id} for month {current_month_year}. Returning default empty quota. Consider seeding data.")
        # You might want to seed data instead of returning this default in a real scenario
        return QuotaRecordInDB(
            user_id=user_id,
            month_year=current_month_year,
            total_quota=0, # Default values if not found
            remaining_quota=0
        )
