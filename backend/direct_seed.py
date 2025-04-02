# Create a file called direct_seed.py in your project root directory
import pymongo
from datetime import datetime

# Connect to MongoDB
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["barrys_suggestions_poc"]

# Constants from App.tsx
MOCK_USER_ID = "user123"
MOCK_INSTRUCTOR_ID = "instructor456"
MOCK_CLASS_ID = "class789"

# Current month in YYYY-MM format
current_month_year = datetime.now().strftime("%Y-%m")

print("Starting database seeding...")

# Insert quota record if it doesn't exist
if not db.quotas.find_one({"user_id": MOCK_USER_ID, "month_year": current_month_year}):
    db.quotas.insert_one({
        "user_id": MOCK_USER_ID,
        "month_year": current_month_year,
        "total_quota": 5,
        "remaining_quota": 5
    })
    print(f"Created quota record for user {MOCK_USER_ID}")
else:
    print(f"Quota record for user {MOCK_USER_ID} already exists")

# Insert sample suggestions if none exist
if db.suggestions.count_documents({"instructor_id": MOCK_INSTRUCTOR_ID}) == 0:
    db.suggestions.insert_many([
        {
            "participant_id": MOCK_USER_ID,
            "instructor_id": MOCK_INSTRUCTOR_ID,
            "class_id": MOCK_CLASS_ID,
            "spotify_uri": "spotify:track:4iJyoBOLtHqaGxP12qzhQI",
            "song_name": "Blinding Lights",
            "artist_name": "The Weeknd",
            "album_cover_url": "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
            "suggestion_date": datetime.utcnow(),
            "status": "pending"
        },
        {
            "participant_id": MOCK_USER_ID,
            "instructor_id": MOCK_INSTRUCTOR_ID,
            "class_id": MOCK_CLASS_ID,
            "spotify_uri": "spotify:track:6UelLqGlWMcVH1E5c4H7lY",
            "song_name": "Watermelon Sugar",
            "artist_name": "Harry Styles",
            "album_cover_url": "https://i.scdn.co/image/ab67616d0000b273da5d5aeeabacacc1263c0f4b",
            "suggestion_date": datetime.utcnow(),
            "status": "approved"
        },
        {
            "participant_id": MOCK_USER_ID,
            "instructor_id": MOCK_INSTRUCTOR_ID,
            "class_id": MOCK_CLASS_ID,
            "spotify_uri": "spotify:track:0E4Y1XIbs8GrAT1YqVy6dq",
            "song_name": "Don't Start Now",
            "artist_name": "Dua Lipa",
            "album_cover_url": "https://i.scdn.co/image/ab67616d0000b2734d4cdef17fc2ce7289ece9fc",
            "suggestion_date": datetime.utcnow(),
            "status": "rejected"
        }
    ])
    print(f"Created 3 sample suggestions for instructor {MOCK_INSTRUCTOR_ID}")
else:
    print(f"Suggestions for instructor {MOCK_INSTRUCTOR_ID} already exist")

print("Database seeding completed!")