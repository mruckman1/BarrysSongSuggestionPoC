## Overview

This application allows Barry's Bootcamp participants to suggest songs for their workout classes and instructors to review, approve, or reject these suggestions. It's designed as a Proof of Concept (PoC) to demonstrate the viability of enhancing participant engagement through music suggestions.

## Features

### Participant View
- Search for songs via Spotify API
- View song details (title, artist, album cover)
- Submit song suggestions for your classes
- Track your monthly suggestion quota

### Instructor View
- View all song suggestions for your classes
- Filter suggestions by status (pending, approved, rejected)
- Approve or reject pending suggestions
- (Future feature) Add approved songs directly to Spotify playlists

## Technology Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Material UI (MUI) for UI components
- Axios for API requests

### Backend
- Python with FastAPI
- MongoDB for database storage
- Motor for asynchronous MongoDB interaction
- Spotify Web API integration

### Infrastructure
- Docker and Docker Compose for containerization
- Environment variables for configuration

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Spotify Developer Account (for API credentials)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd barrys-song-suggestion
```

2. Create a `.env` file in the project root with your Spotify API credentials
```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
MONGODB_DB_NAME=barrys_suggestions_poc
```

3. Start the application using Docker Compose
```bash
docker-compose up -d
```

4. Seed the database with initial data (if not automatically seeded)
```bash
docker-compose exec mongo mongosh barrys_suggestions_poc

# Then in the MongoDB shell, paste:
db.quotas.insertOne({
    "user_id": "user123", 
    "month_year": new Date().toISOString().substring(0,7), 
    "total_quota": 5, 
    "remaining_quota": 5
});

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
```

5. Access the application at http://localhost:3000

## Usage

### Participant View
1. Select the "Participant View" tab
2. Check your remaining suggestion quota
3. Search for a song by title or artist
4. Click on a song in the results to suggest it
5. You'll receive confirmation when your suggestion is submitted

### Instructor View
1. Select the "Instructor View" tab
2. Browse pending suggestions
3. Click "Approve" or "Reject" to update suggestion status
4. Use the status filter to view suggestions by their current status

## Project Structure

```
├── backend/
│   ├── app.py                 # FastAPI application entry point
│   ├── database.py            # MongoDB connection management
│   ├── models.py              # Pydantic data models
│   ├── spotify.py             # Spotify API integration
│   ├── seed_data.py           # Database seeding functionality
│   └── direct_seed.py         # Standalone seeding script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── SongSearch.tsx     # Participant view component
│   │   │   └── SuggestionList.tsx # Instructor view component
│   │   ├── services/
│   │   │   └── api.ts             # Backend API client
│   │   ├── App.tsx                # Main application component
│   │   └── main.tsx               # Application entry point
│   ├── index.html                 # HTML template
│   └── vite.config.ts             # Vite configuration
├── docker-compose.yml         # Docker Compose configuration
└── seed.js                    # MongoDB seeding script
```

## Development Notes

### Phase 1 Implementation
- Core functionality implemented: search, suggest, review
- Quota system mocked with MongoDB storage
- Basic UI with Material UI components

### Mock Data
For the PoC, the application uses fixed mock IDs:
- User ID: `user123`
- Instructor ID: `instructor456`
- Class ID: `class789`

## Future Enhancements

### Phase 2
- Authentication integration with Barry's existing system
- Real quota calculation based on class attendance
- Enhanced UI styling to match Barry's branding

### Phase 3
- Instructor Spotify playlist integration
- User history and suggestion tracking
- Mobile-optimized responsive design

### Phase 4
- Analytics dashboard for music preferences
- Automated playlist generation based on popular suggestions
- Integration with in-studio audio systems

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Code Style
- Frontend: ESLint and Prettier
- Backend: Black and Flake8

## License

[MIT License]

## Acknowledgments

- Built with Spotify Web API
- Inspired by Barry's Bootcamp's music-driven workouts

---

*This project is a Proof of Concept and not affiliated with the official Barry's Bootcamp.*