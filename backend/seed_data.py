# backend/seed_data.py
import asyncio
import logging
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def ensure_quota_record_exists(quotas_collection: AsyncIOMotorCollection, user_id: str, quota_amount: int = 5):
    """
    Ensures at least one quota record exists for the given user.
    If no record exists, creates one with the specified quota amount.
    """
    # Get current month/year in format YYYY-MM
    current_month_year = datetime.now().strftime("%Y-%m")
    
    # Check if a quota record already exists for this user and month
    existing_record = await quotas_collection.find_one({
        "user_id": user_id,
        "month_year": current_month_year
    })
    
    if existing_record:
        logger.info(f"Quota record already exists for user {user_id} in {current_month_year}")
        return
    
    # No record exists, create a new one
    new_quota = {
        "user_id": user_id,
        "month_year": current_month_year,
        "total_quota": quota_amount,
        "remaining_quota": quota_amount
    }
    
    result = await quotas_collection.insert_one(new_quota)
    logger.info(f"Created quota record for user {user_id} with {quota_amount} suggestions (ID: {result.inserted_id})")

async def ensure_sample_suggestions_exist(suggestions_collection: AsyncIOMotorCollection, 
                                         instructor_id: str, 
                                         mock_user_id: str = "user123",
                                         class_id: str = "class789"):
    """
    Ensures sample song suggestions exist for the demo.
    Creates samples if none are found for the given instructor.
    """
    # Check if suggestions already exist for this instructor
    count = await suggestions_collection.count_documents({"instructor_id": instructor_id})
    
    if count > 0:
        logger.info(f"Found {count} existing suggestions for instructor {instructor_id}")
        return
    
    # Create sample suggestions
    sample_suggestions = [
        {
            "participant_id": mock_user_id,
            "instructor_id": instructor_id,
            "class_id": class_id,
            "spotify_uri": "spotify:track:4iJyoBOLtHqaGxP12qzhQI",
            "song_name": "Blinding Lights",
            "artist_name": "The Weeknd",
            "album_cover_url": "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
            "suggestion_date": datetime.utcnow(),
            "status": "pending"
        },
        {
            "participant_id": mock_user_id,
            "instructor_id": instructor_id,
            "class_id": class_id,
            "spotify_uri": "spotify:track:6UelLqGlWMcVH1E5c4H7lY",
            "song_name": "Watermelon Sugar",
            "artist_name": "Harry Styles",
            "album_cover_url": "https://i.scdn.co/image/ab67616d0000b273da5d5aeeabacacc1263c0f4b",
            "suggestion_date": datetime.utcnow(),
            "status": "approved"
        },
        {
            "participant_id": mock_user_id,
            "instructor_id": instructor_id,
            "class_id": class_id,
            "spotify_uri": "spotify:track:0E4Y1XIbs8GrAT1YqVy6dq",
            "song_name": "Don't Start Now",
            "artist_name": "Dua Lipa",
            "album_cover_url": "https://i.scdn.co/image/ab67616d0000b2734d4cdef17fc2ce7289ece9fc",
            "suggestion_date": datetime.utcnow(),
            "status": "rejected"
        }
    ]
    
    result = await suggestions_collection.insert_many(sample_suggestions)
    logger.info(f"Created {len(result.inserted_ids)} sample suggestions for instructor {instructor_id}")

async def seed_database(db: AsyncIOMotorDatabase):
    """
    Main function to seed the database with necessary initial data.
    Calls individual seeding functions and handles any exceptions.
    """
    logger.info("Starting database seeding process...")
    
    try:
        # Get collections
        quotas_collection = db["quotas"]
        suggestions_collection = db["suggestions"]
        
        # Seed records with mocked IDs from App.tsx
        mock_user_id = "user123"
        mock_instructor_id = "instructor456"
        mock_class_id = "class789"
        
        # Ensure quota record exists
        await ensure_quota_record_exists(quotas_collection, mock_user_id, quota_amount=5)
        
        # Ensure sample suggestions exist
        await ensure_sample_suggestions_exist(
            suggestions_collection, 
            instructor_id=mock_instructor_id,
            mock_user_id=mock_user_id,
            class_id=mock_class_id
        )
        
        logger.info("Database seeding completed successfully")
        
    except Exception as e:
        logger.error(f"Error during database seeding: {e}")
        # Don't re-raise, as we want the app to continue starting up even if seeding fails

# For running the script directly
if __name__ == "__main__":
    import os
    from database import connect_to_mongo, close_mongo_connection, get_database
    
    async def run_seeder():
        client = await connect_to_mongo()
        if client:
            try:
                db_name = os.getenv("MONGODB_DB_NAME", "barrys_suggestions_poc")
                logger.info(f"Using database: {db_name}")
                db = client[db_name]
                await seed_database(db)
            finally:
                await close_mongo_connection(client)
        else:
            logger.error("MongoDB connection failed, cannot seed database")
    
    asyncio.run(run_seeder())