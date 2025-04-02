// frontend/src/components/SongSearch.tsx
import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import api, { Song } from '../services/api';

// MUI Imports
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

// MUI Icon Imports
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

interface SongSearchProps {
  userId: string;
  classId: string;
}

const SongSearch: React.FC<SongSearchProps> = ({ userId, classId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  // Separate Loading States
  const [isQuotaLoading, setIsQuotaLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // Store ID of song being submitted
  // ---
  const [quota, setQuota] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info');


  // --- Load initial quota ---
  useEffect(() => {
    let isMounted = true;
    setIsQuotaLoading(true);
    api.checkQuota(userId)
      .then(remainingQuota => {
        if (isMounted) setQuota(remainingQuota);
      })
      .catch(err => {
        console.error("Failed to load quota:", err);
        if (isMounted) {
            setSnackbarSeverity('error');
            setSnackbarMessage('Error loading suggestion quota.');
            setSnackbarOpen(true);
            setQuota(0); // Default to 0 on error
        }
      })
      .finally(() => {
        if (isMounted) setIsQuotaLoading(false);
      });
      return () => { isMounted = false };
  }, [userId]);


  // --- Debounced Search Function ---
  const performSearch = async (searchQuery: string) => {
      if (!searchQuery.trim()) {
          setResults([]);
          setIsSearching(false); // Ensure searching is false if query is cleared
          return;
      }
      console.log(`Performing search for: ${searchQuery}`);
      setIsSearching(true); // Set searching TRUE right before API call
      try {
          const songs = await api.searchSongs(searchQuery);
          setResults(songs);
      } catch (error) {
          console.error("Search API call failed:", error);
          setSnackbarSeverity('error');
          setSnackbarMessage('Error searching for songs.');
          setSnackbarOpen(true);
          setResults([]);
      } finally {
          setIsSearching(false); // Set searching FALSE after API call completes (success or fail)
      }
  };

  // Use useCallback for the debounced version
  const debouncedSearch = useCallback(debounce(performSearch, 500), []);


  // --- Effect to trigger debounced search ---
  useEffect(() => {
    // Trigger the debounced function when query changes
    debouncedSearch(query);

    // If query is empty, clear results immediately and cancel any pending search
    if (!query.trim()) {
        setIsSearching(false); // Explicitly set searching to false
        setResults([]);
        debouncedSearch.cancel();
    }

    // Cleanup function for the debounce effect
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);


  // --- Handle Suggestion Submission ---
  const handleSuggestSong = async (song: Song) => {
    // Check quota first
     if (quota === null || quota <= 0) {
      setSnackbarSeverity('warning');
      setSnackbarMessage('No suggestions remaining this month.');
      setSnackbarOpen(true);
      return;
    }
    // Prevent clicking if this song or another is already submitting
    if (isSubmitting) {
        console.log("Ignoring suggestion click while another submission is in progress.");
        return;
    }

    setIsSubmitting(song.id); // Set submitting state with the song ID
    setSnackbarSeverity('info');
    setSnackbarMessage(`Suggesting "${song.name}"...`);
    setSnackbarOpen(true);

    try {
      await api.submitSuggestion(song, classId);

      // Success: Update UI
      setSnackbarSeverity('success');
      setSnackbarMessage(`"${song.name}" suggested!`);
      setQuota(prevQuota => (prevQuota !== null ? prevQuota - 1 : 0));
      setQuery(''); // Clear search after successful suggestion
      setResults([]); // Clear results after successful suggestion

    } catch (error: any) {
        console.error("Submit suggestion failed:", error);
        if (error.message === "Quota exceeded") {
            setSnackbarSeverity('warning');
            setSnackbarMessage('Suggestion failed: No quota remaining.');
            // Optionally refresh quota
            // setIsQuotaLoading(true); api.checkQuota(userId).then(setQuota).finally(() => setIsQuotaLoading(false));
        } else {
            setSnackbarSeverity('error');
            const detail = error?.response?.data?.detail || `Error suggesting "${song.name}".`;
            setSnackbarMessage(detail);
        }
        setSnackbarOpen(true); // Re-open snackbar for error message
    } finally {
        setIsSubmitting(null); // Clear submitting state regardless of outcome
        // Don't re-open snackbar here, let try/catch handle it
    }
  };

  // --- Other Handlers ---
  const handleClearSearch = () => {
    setQuery('');
    // Results and searching state are cleared by the useEffect watching query
  };

  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') { return; }
    setSnackbarOpen(false);
  };

  // --- Render Component ---
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h2" gutterBottom>
          Suggest a Song
        </Typography>

        {/* Quota Display */}
        <Box sx={{ minHeight: '24px' }}> {/* Reserve space to prevent layout shift */}
            {isQuotaLoading ? (
                <Typography variant="subtitle1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    Loading quota... <CircularProgress size={16} sx={{ ml: 1 }} />
                </Typography>
            ) : quota !== null ? (
                <Typography variant="subtitle1" color={quota === 0 ? 'error' : 'text.secondary'}>
                    Suggestions remaining this month: {quota}
                </Typography>
            ) : (
                <Typography variant="subtitle1" color="error">
                    Could not load quota information.
                </Typography>
            )}
        </Box>


        {/* Search Input */}
        <TextField
          label="Search for a song or artist"
          variant="outlined"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Disable only if initial quota is loading, allow typing during search/submit
          disabled={isQuotaLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {/* Show loading spinner only during active API search */}
                {isSearching && <CircularProgress size={20} sx={{ mr: 1 }}/>}
                {query && !isSearching && !isQuotaLoading && (
                  <IconButton
                    aria-label="clear search"
                    onClick={handleClearSearch}
                    edge="end"
                    disabled={!!isSubmitting} // Disable clear while submitting
                  >
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
        />

        {/* Results List */}
        <Box sx={{ maxHeight: '40vh', overflowY: 'auto', minHeight: '50px' }}> {/* Added minHeight */}
           {/* Show placeholder/loading text only when actively searching */}
           {isSearching && !results.length && (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
             </Box>
           )}
           {!isSearching && query.length > 0 && results.length === 0 && (
             <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
               No results found for "{query}".
             </Typography>
           )}
          <List disablePadding>
            {results.map((song) => (
              <ListItem key={song.id} disablePadding
                  // Add visual indication if this item is being submitted
                  sx={ isSubmitting === song.id ? { opacity: 0.5, pointerEvents: 'none' } : {} }
              >
                <ListItemButton
                  onClick={() => handleSuggestSong(song)}
                  // Disable if ANY submission is happening OR quota is invalid/zero
                  disabled={!!isSubmitting || quota === 0 || quota === null}
                >
                  <ListItemAvatar>
                    <Avatar src={song.albumCover} variant="rounded">
                      {!song.albumCover && <MusicNoteIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={song.name}
                    secondary={song.artist}
                  />
                   {/* Show spinner next to the item if it's being submitted */}
                  {isSubmitting === song.id && <CircularProgress size={24} sx={{ ml: 'auto' }} />}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

         {/* Snackbar for Feedback */}
         <Snackbar
            open={snackbarOpen}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
              {snackbarMessage}
            </Alert>
          </Snackbar>

      </Stack>
    </Paper>
  );
};

export default SongSearch;