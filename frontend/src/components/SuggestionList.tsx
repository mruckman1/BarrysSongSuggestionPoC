// frontend/src/components/SuggestionList.tsx
import React, { useState, useEffect } from 'react';
import api, { SongSuggestion } from '../services/api'; // Use the updated interface

// MUI Imports
import Box from '@mui/material/Box';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
// Removed IconButton import as it's not used in this component's current structure
// import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Alert, { AlertColor } from '@mui/material/Alert';

// MUI Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

interface SuggestionListProps {
  instructorId: string;
}

const SuggestionList: React.FC<SuggestionListProps> = ({ instructorId }) => {
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [loading, setLoading] = useState(true); // Loading suggestions list
  const [updatingId, setUpdatingId] = useState<string | null>(null); // Track which suggestion is being updated
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('info');

  // --- Load Suggestions ---
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    // Pass filter correctly to the backend-connected API call
    api.getSuggestions(instructorId, filter === 'all' ? undefined : filter)
      .then(data => {
        // Backend now returns the flat structure matching SongSuggestion
        if (isMounted) setSuggestions(data);
      })
      .catch(err => {
        console.error("Failed to load suggestions:", err);
         if (isMounted) {
            setSnackbarSeverity('error');
            setSnackbarMessage('Error loading suggestions.');
            setSnackbarOpen(true);
         }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
      return () => { isMounted = false };
  }, [instructorId, filter]); // Reload when filter or instructorId changes

  // --- Handle Status Change ---
  const handleStatusChange = async (suggestionId: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingId(suggestionId); // Show loading indicator for this specific item
    setSnackbarOpen(false); // Close previous snackbar if any

    // Call the backend-connected API function
    const updatedSuggestion = await api.updateSuggestionStatus(suggestionId, newStatus);

    if (updatedSuggestion) {
        // Update the local state with the data returned from the backend
        setSuggestions(prevSuggestions =>
            prevSuggestions.map(suggestion =>
                suggestion.id === suggestionId ? updatedSuggestion : suggestion
            )
        );
        setSnackbarSeverity('success');
        setSnackbarMessage(`Suggestion ${newStatus}.`);
        setSnackbarOpen(true);
    } else {
        // Handle API call failure
        setSnackbarSeverity('error');
        setSnackbarMessage(`Failed to update suggestion status.`);
        setSnackbarOpen(true);
    }
    setUpdatingId(null); // Stop loading indicator for this item regardless of outcome
  };

  // --- Handle Filter Change ---
  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilter(event.target.value);
    // Data reloading is handled by the useEffect hook watching 'filter'
  };

  // --- Handle Snackbar Close ---
   const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // --- Handle Add to Playlist (Placeholder) ---
  const handleAddToPlaylist = (songUri: string) => {
      // TODO: Implement Phase 4: Instructor Spotify Playlist Integration
      setSnackbarSeverity('info');
      setSnackbarMessage(`(PoC) Would add ${songUri} to playlist.`);
      setSnackbarOpen(true);
      console.log(`[Mock] Add to playlist clicked for: ${songUri}`);
  }

  // --- Render Component ---
  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
            <Typography variant="h5" component="h2" gutterBottom>
                Song Suggestions
            </Typography>

            {/* Filter Dropdown */}
            <FormControl sx={{ minWidth: 120, alignSelf: 'flex-end' }} size="small">
                <InputLabel id="suggestion-filter-label">Status</InputLabel>
                <Select
                    labelId="suggestion-filter-label"
                    id="suggestion-filter-select"
                    value={filter}
                    label="Status"
                    onChange={handleFilterChange}
                    disabled={loading}
                >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
            </FormControl>

            {/* Suggestions List */}
            <Box>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                )}
                {!loading && suggestions.length === 0 && (
                    <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                        No {filter !== 'all' ? filter : ''} suggestions found.
                    </Typography>
                )}
                {!loading && suggestions.length > 0 && (
                    <List disablePadding>
                        {suggestions.map((suggestion, index) => (
                            <React.Fragment key={suggestion.id}>
                                <ListItem
                                    secondaryAction={ // Buttons on the right
                                        <Stack direction="row" spacing={1}>
                                            {updatingId === suggestion.id ? (
                                                <CircularProgress size={24} />
                                            ) : (
                                                <>
                                                    {suggestion.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                size="small"
                                                                startIcon={<CheckCircleOutlineIcon />}
                                                                onClick={() => handleStatusChange(suggestion.id, 'approved')}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                color="error"
                                                                size="small"
                                                                startIcon={<CancelIcon />}
                                                                onClick={() => handleStatusChange(suggestion.id, 'rejected')}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </>
                                                    )}
                                                    {suggestion.status === 'approved' && (
                                                        <Button
                                                            variant="contained"
                                                            size="small"
                                                            startIcon={<PlaylistAddIcon />}
                                                            onClick={() => handleAddToPlaylist(suggestion.spotify_uri)}
                                                            // Disable this until implemented
                                                            disabled
                                                        >
                                                            Add to Playlist
                                                        </Button>
                                                    )}
                                                    {/* Optionally show something for rejected, or nothing */}
                                                    {/* {suggestion.status === 'rejected' && (<Typography variant="caption" color="error">Rejected</Typography>)} */}
                                                </>
                                            )}
                                        </Stack>
                                    }
                                >
                                    <ListItemAvatar>
                                        {/* Use album_cover_url directly from the flat structure */}
                                        <Avatar src={suggestion.album_cover_url} variant="rounded">
                                            {!suggestion.album_cover_url && <MusicNoteIcon />}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        // Use direct properties from the flat structure
                                        primary={suggestion.song_name}
                                        secondary={suggestion.artist_name}
                                        // Optional: Add suggested date or participant info
                                        // secondaryTypographyProps={{ component: 'span' }}
                                        // secondary={<>{suggestion.artist_name}<br/><Typography variant="caption">Suggested by {suggestion.participant_id} on {new Date(suggestion.suggestion_date).toLocaleDateString()}</Typography></>}
                                    />
                                </ListItem>
                                {index < suggestions.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                )}
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

export default SuggestionList;