// frontend/src/components/SongSearch.tsx
import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import api, { Song } from '../services/api';
// --- Import hooks for routing ---
import { useParams, useNavigate } from 'react-router-dom';

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
// Removed Button import as we use IconButton for back

// MUI Icon Imports
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Icon for Back button

interface SongSearchProps {
  userId: string;
  // classId is now retrieved from URL params, remove from props
}

// Update component definition to accept props
const SongSearch: React.FC<SongSearchProps> = ({ userId }) => {
  // --- Get classId from URL and navigate function ---
  const { classId } = useParams<{ classId: string }>(); // Get classId from route parameter
  const navigate = useNavigate(); // Hook for navigation

  // State hooks (remain the same)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isQuotaLoading, setIsQuotaLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [quota, setQuota] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info');

  // --- Load initial quota (remains the same) ---
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


  // --- Debounced Search Function (remains the same) ---
  const performSearch = async (searchQuery: string) => {
      if (!searchQuery.trim()) {
          setResults([]);
          setIsSearching(false);
          return;
      }
      console.log(`Performing search for: ${searchQuery}`);
      setIsSearching(true);
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
          setIsSearching(false);
      }
  };

  const debouncedSearch = useCallback(debounce(performSearch, 500), []);


  // --- Effect to trigger debounced search (remains the same) ---
  useEffect(() => {
    debouncedSearch(query);
    if (!query.trim()) {
        setIsSearching(false);
        setResults([]);
        debouncedSearch.cancel();
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);


  // --- Handle Suggestion Submission ---
  const handleSuggestSong = async (song: Song) => {
    // --- Check if classId exists from URL ---
    if (!classId) {
        console.error("Cannot suggest song: classId is missing from URL.");
        setSnackbarSeverity('error');
        setSnackbarMessage('Error: Class ID not found. Cannot submit suggestion.');
        setSnackbarOpen(true);
        return; // Prevent submission
    }

     if (quota === null || quota <= 0) {
      setSnackbarSeverity('warning');
      setSnackbarMessage('No suggestions remaining this month.');
      setSnackbarOpen(true);
      return;
    }
    if (isSubmitting) {
        console.log("Ignoring suggestion click while another submission is in progress.");
        return;
    }

    setIsSubmitting(song.id);
    setSnackbarSeverity('info');
    setSnackbarMessage(`Suggesting "${song.name}"...`);
    setSnackbarOpen(true);

    try {
      // --- Pass classId retrieved from useParams ---
      await api.submitSuggestion(song, classId);

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
        } else {
            setSnackbarSeverity('error');
            const detail = error?.response?.data?.detail || `Error suggesting "${song.name}".`;
            setSnackbarMessage(detail);
        }
        setSnackbarOpen(true); // Re-open snackbar for error message
    } finally {
        setIsSubmitting(null); // Clear submitting state regardless of outcome
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

  // --- Handler for Back Button ---
  const handleGoBack = () => {
      navigate(-1); // Go back to the previous page (ClassDetailPage)
  };

  // --- Render Component ---
  return (
    // Wrap in Paper for visual consistency if desired (already wrapped in Container in App.tsx)
    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 } }}> {/* Use elevation 0 if Container provides bg */}
      <Stack spacing={2}>
        {/* --- Back Button and Title --- */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <IconButton onClick={handleGoBack} aria-label="go back" size="medium" sx={{ mr: 1 }}>
                <ArrowBackIcon />
            </IconButton>
            {/* Adjust title styling as needed */}
            <Typography variant="h5" component="h2" fontWeight="bold">
                Suggest a Song
            </Typography>
        </Box>

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
        {/* Adjust maxHeight/minHeight as needed for the layout */}
        <Box sx={{ maxHeight: '50vh', overflowY: 'auto', minHeight: '150px' }}>
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
            autoHideDuration={4000} // Duration feedback stays visible
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position
          >
            {/* Use Alert component inside Snackbar for styling */}
            <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
              {snackbarMessage}
            </Alert>
          </Snackbar>

      </Stack>
    </Paper>
  );
};

export default SongSearch;