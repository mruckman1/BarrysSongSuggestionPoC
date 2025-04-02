// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx'; // Import the main App component
import './index.css';     // Import global CSS

// MUI Imports for Theme
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create a basic default MUI theme (can be customized later)
const theme = createTheme({
  // You can customize palette, typography, etc. here
  // Example:
  // palette: {
  //   primary: {
  //     main: '#d32f2f', // Example: Barry's Red
  //   },
  // },
});

// Find the root element
const rootElement = document.getElementById('root');

// Ensure the root element exists before trying to render
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline /> {/* Normalizes browser styles */}
        <App /> {/* Render the main App component */}
      </ThemeProvider>
    </React.StrictMode>,
  );
} else {
  console.error("Failed to find the root element. Check your index.html file.");
  document.body.innerHTML = '<h1 style="color: red;">Error: Root element not found! Cannot render React app.</h1>';
}