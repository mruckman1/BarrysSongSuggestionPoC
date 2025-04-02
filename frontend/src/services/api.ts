// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

console.log("API Base URL:", API_BASE_URL);

// --- Types ---

// From Spotify API via backend proxy
interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  uri: string;
}

interface SpotifySearchApiResponse {
    tracks: {
        items: SpotifyApiTrack[];
    };
}

// Frontend internal representation of a song (used in components)
interface Song {
  id: string;
  name: string;
  artist: string;
  albumCover: string;
  spotifyUri: string;
}

// --- Backend Data Models (Mirrored for Frontend Typing) ---
// Matches backend models.py/QuotaRecordInDB
interface QuotaRecord {
    id: string; // MongoDB ObjectId as string
    user_id: string;
    month_year: string;
    total_quota: number;
    remaining_quota: number;
}

// Matches backend models.py/SongSuggestionInDB (Flat structure)
interface SongSuggestion {
  id: string; // MongoDB ObjectId as string
  participant_id: string;
  instructor_id: string;
  class_id: string;
  spotify_uri: string;
  song_name: string;
  artist_name: string;
  album_cover_url?: string;
  suggestion_date: string; // ISO date string
  status: 'pending' | 'approved' | 'rejected';
}

// Payload for creating suggestion (Matches backend SongSuggestionCreate + needed fields)
interface SuggestionCreatePayload {
    spotify_uri: string;
    song_name: string;
    artist_name: string;
    album_cover_url?: string;
    class_id: string;
}

// Payload for updating status (Matches backend SongSuggestionUpdateStatus)
interface SuggestionStatusUpdatePayload {
    status: 'approved' | 'rejected';
}


// --- API Client ---
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});


const api = {
  // --- Spotify search proxy (Already implemented) ---
  searchSongs: async (query: string): Promise<Song[]> => {
    if (!query.trim()) { return []; }
    try {
      console.log(`Searching backend via API for: ${query}`);
      const response = await apiClient.get<SpotifySearchApiResponse>('/spotify/search', {
          params: { q: query }
      });
      const { data } = response;
      if (data.tracks && data.tracks.items) {
          return data.tracks.items.map((item: SpotifyApiTrack) => ({
              id: item.id,
              name: item.name,
              artist: item.artists.length > 0 ? item.artists.map(a => a.name).join(', ') : 'Unknown Artist',
              albumCover: item.album.images.length > 0 ? item.album.images[0].url : 'https://via.placeholder.com/60',
              spotifyUri: item.uri
          }));
      } else {
          console.warn("Unexpected response structure from backend search:", data);
          return [];
      }
    } catch (error) {
        if (axios.isAxiosError(error)) { console.error('Axios error searching songs:', error.message, error.response?.data); }
        else { console.error('Generic error searching songs:', error); }
        return [];
    }
  },

  // --- Submit a song suggestion ---
  // --- NOW CONNECTED TO BACKEND ---
  submitSuggestion: async (song: Song, classId: string): Promise<boolean> => {
    const payload: SuggestionCreatePayload = {
        spotify_uri: song.spotifyUri,
        song_name: song.name,
        artist_name: song.artist, // Assuming Song.artist holds the string needed
        album_cover_url: song.albumCover,
        class_id: classId,
    };
    try {
      console.log(`Submitting suggestion to backend:`, payload);
      // Calls POST http://localhost:8000/suggestions
      const response = await apiClient.post<SongSuggestion>('/suggestions/', payload); // Note trailing slash if router expects it
      // Check for successful status code (e.g., 201 Created)
      return response.status === 201;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Axios error submitting suggestion:', error.message, error.response?.data);
            // Optionally, re-throw specific errors or return error details
            if (error.response?.status === 403) {
                 console.warn("Suggestion failed: Quota exceeded.");
                 // Let the calling component handle showing the specific message
                 throw new Error("Quota exceeded"); // Throw specific error
            }
        } else {
            console.error('Generic error submitting suggestion:', error);
        }
        throw error; // Re-throw other errors to be caught by the component
    }
  },

  // --- Get suggestions for instructor ---
  // --- NOW CONNECTED TO BACKEND ---
  getSuggestions: async (instructorId: string, statusFilter?: string): Promise<SongSuggestion[]> => {
    try {
      console.log(`Getting suggestions from backend for instructor: ${instructorId}, status: ${statusFilter || 'all'}`);
      const params: { instructor_id: string; status?: string } = { instructor_id: instructorId };
      if (statusFilter && statusFilter !== 'all') {
          params.status = statusFilter;
      }
      // Calls GET http://localhost:8000/suggestions?instructor_id=...&status=...
      const response = await apiClient.get<SongSuggestion[]>('/suggestions/', { params }); // Note trailing slash
      // Backend now returns the correct flat structure (SongSuggestionInDB),
      // which matches our frontend SongSuggestion type.
      return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) { console.error('Axios error getting suggestions:', error.message, error.response?.data); }
        else { console.error('Generic error getting suggestions:', error); }
        return []; // Return empty array on error
    }
  },

  // --- Check remaining quota ---
  // --- NOW CONNECTED TO BACKEND ---
  checkQuota: async (userId: string): Promise<number> => {
    try {
      console.log(`Checking quota via backend for user: ${userId}`);
      // Calls GET http://localhost:8000/quota/{userId}
      const response = await apiClient.get<QuotaRecord>(`/quota/${userId}`);
      return response.data.remaining_quota;
    } catch (error) {
      if (axios.isAxiosError(error)) {
          // Handle 404 specifically if backend returns that when no record exists
          if (error.response?.status === 404) {
              console.warn(`Quota record not found for user ${userId}, returning 0.`);
              return 0;
          }
          console.error('Axios error checking quota:', error.message, error.response?.data);
      } else {
          console.error('Generic error checking quota:', error);
      }
      return 0; // Return 0 quota on any other error
    }
  },

  // --- Update Suggestion Status ---
  // --- NEW FUNCTION ---
  updateSuggestionStatus: async (suggestionId: string, newStatus: 'approved' | 'rejected'): Promise<SongSuggestion | null> => {
      const payload: SuggestionStatusUpdatePayload = { status: newStatus };
      try {
          console.log(`Updating suggestion ${suggestionId} to ${newStatus} via backend`);
          // Calls PATCH http://localhost:8000/suggestions/{suggestionId}
          const response = await apiClient.patch<SongSuggestion>(`/suggestions/${suggestionId}`, payload);
          return response.data; // Return the updated suggestion data
      } catch (error) {
            if (axios.isAxiosError(error)) { console.error(`Axios error updating suggestion ${suggestionId}:`, error.message, error.response?.data); }
            else { console.error(`Generic error updating suggestion ${suggestionId}:`, error); }
            return null; // Indicate failure
      }
  }
};

export default api;
// Export relevant types
export type { Song, SongSuggestion, QuotaRecord };