# backend/database.py
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME")

if not MONGO_URI:
    logger.warning("MONGODB_URI environment variable not set. Using default 'mongodb://localhost:27017'")
    MONGO_URI = "mongodb://localhost:27017"

if not DB_NAME:
    logger.warning("MONGODB_DB_NAME environment variable not set. Using default 'barrys_suggestions_poc'")
    DB_NAME = "barrys_suggestions_poc"

# --- MongoDB Client Instance ---
# Create the client instance once. Motor handles connection pooling.
mongo_client: AsyncIOMotorClient | None = None

# --- Connection Management Functions ---
async def connect_to_mongo():
    """Establishes the MongoDB connection."""
    global mongo_client
    logger.info(f"Attempting to connect to MongoDB at {MONGO_URI}...")
    try:
        mongo_client = AsyncIOMotorClient(MONGO_URI)
        # The ismaster command is cheap and does not require auth.
        await mongo_client.admin.command('ismaster')
        logger.info(f"Successfully connected to MongoDB. Using database: {DB_NAME}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        mongo_client = None # Ensure client is None if connection failed

# Updated function in database.py 
async def close_mongo_connection(client=None):
    """Closes the MongoDB connection."""
    global mongo_client
    client_to_close = client or mongo_client
    if client_to_close:
        logger.info("Closing MongoDB connection...")
        client_to_close.close()
        logger.info("MongoDB connection closed.")
    if client == mongo_client:
        mongo_client = None

# --- Database and Collection Access Functions ---
def get_database() -> AsyncIOMotorDatabase:
    """Returns the application's database instance."""
    if not mongo_client:
        raise RuntimeError("MongoDB connection not established. Call connect_to_mongo() first.")
    return mongo_client[DB_NAME]

def get_suggestions_collection() -> AsyncIOMotorCollection:
    """Returns the 'suggestions' collection instance."""
    db = get_database()
    return db["suggestions"]

def get_quotas_collection() -> AsyncIOMotorCollection:
    """Returns the 'quotas' collection instance."""
    db = get_database()
    return db["quotas"]

# --- Example Usage (for testing module directly) ---
async def _test_connection():
    await connect_to_mongo()
    if mongo_client:
        try:
            db = get_database()
            logger.info(f"Database object: {db}")
            suggestions_coll = get_suggestions_collection()
            logger.info(f"Suggestions collection object: {suggestions_coll}")
            # Example: Insert and find test doc
            await suggestions_coll.insert_one({"test": "doc"})
            doc = await suggestions_coll.find_one({"test": "doc"})
            logger.info(f"Found test document: {doc}")
            await suggestions_coll.delete_one({"test": "doc"})
        except Exception as e:
            logger.error(f"Error during test operation: {e}")
        finally:
            await close_mongo_connection()
    else:
        logger.error("Cannot run test, MongoDB connection failed.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(_test_connection())