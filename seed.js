db = db.getSiblingDB("barrys_suggestions_poc");

// Insert quota record
db.quotas.insertOne({
    "user_id": "user123", 
    "month_year": new Date().toISOString().substring(0,7), 
    "total_quota": 5, 
    "remaining_quota": 5
});

// Insert sample suggestions
db.suggestions.insertMany([
    {
        "participant_id": "user123",
        "instructor_id": "instructor456",
        "class_id": "class789",
        "spotify_uri": "spotify:track:4iJyoBOLtHqaGxP12qzhQI",
        "song_name": "Blinding Lights",
        "artist_name": "The Weeknd",
        "album_cover_url": "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
        "suggestion_date": new Date(),
        "status": "pending"
    },
    {
        "participant_id": "user123",
        "instructor_id": "instructor456",
        "class_id": "class789",
        "spotify_uri": "spotify:track:6UelLqGlWMcVH1E5c4H7lY",
        "song_name": "Watermelon Sugar",
        "artist_name": "Harry Styles",
        "album_cover_url": "https://i.scdn.co/image/ab67616d0000b273da5d5aeeabacacc1263c0f4b",
        "suggestion_date": new Date(),
        "status": "approved"
    },
    {
        "participant_id": "user123",
        "instructor_id": "instructor456",
        "class_id": "class789",
        "spotify_uri": "spotify:track:0E4Y1XIbs8GrAT1YqVy6dq",
        "song_name": "Don't Start Now",
        "artist_name": "Dua Lipa",
        "album_cover_url": "https://i.scdn.co/image/ab67616d0000b2734d4cdef17fc2ce7289ece9fc",
        "suggestion_date": new Date(),
        "status": "rejected"
    }
]);

print("Database seeding completed!");