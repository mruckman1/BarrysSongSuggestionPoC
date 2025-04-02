// frontend/src/App.tsx
import React from 'react';
// Import Link for navigation
import { Routes, Route, Navigate, Link as RouterLink } from 'react-router-dom';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box'; // Import Box for layout
import Link from '@mui/material/Link'; // Can use MUI Link styled as RouterLink

// Import pages/components
import SuggestionList from './components/SuggestionList';
import ClassDetailPage from './pages/ClassDetailPage';
import SongSearch from './components/SongSearch';

// Import CSS
import './App.css';

// Mock data
const MOCK_USER_ID = 'user123';
const MOCK_INSTRUCTOR_ID = 'instructor456';

const App: React.FC = () => {
  return (
    <>
      {/* --- NEW: Link to Instructor View --- */}
      <Box sx={{ p: 2, textAlign: 'center', borderBottom: 1, borderColor: 'divider' }}>
        {/* Use MUI Link component styled to behave like RouterLink */}
        <Link
          component={RouterLink} // Use react-router-dom Link for navigation
          to="/instructor-dashboard"
          underline="hover" // Standard link appearance
        >
          Go to Instructor View
        </Link>
      </Box>
      {/* --- End New Link --- */}


      {/* Routes definition */}
      <Routes>
        {/* Default Route: Redirects to the mock class detail page */}
        <Route path="/" element={<Navigate replace to="/class-detail" />} />

        {/* Instructor Dashboard Route */}
        <Route
          path="/instructor-dashboard"
          element={
             <Container maxWidth="md" sx={{py: 3}}>
                  <SuggestionList instructorId={MOCK_INSTRUCTOR_ID} />
             </Container>
          }
        />

        {/* Static Class Detail Page Route (for PoC) */}
        <Route
          path="/class-detail"
          element={<ClassDetailPage />}
        />

        {/* Route for Song Suggestion Page */}
        <Route
          path="/suggest-song/:classId"
          element={
              <Container maxWidth="sm" sx={{ py: 3 }}>
                  <SongSearch userId={MOCK_USER_ID} />
              </Container>
          }
        />

        {/* Optional: Add a 404 Not Found route */}
        <Route path="*" element={<Container sx={{p: 3}}><h2>404 Not Found</h2><p>The page you requested does not exist.</p></Container>} />
      </Routes>
    </>
  );
};

export default App;