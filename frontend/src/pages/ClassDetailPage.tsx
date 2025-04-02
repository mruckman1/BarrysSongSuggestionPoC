// frontend/src/pages/ClassDetailPage.tsx
import React from 'react';
// Import RouterLink for navigation component prop
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// MUI Imports
// --- Removed Container import ---
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
// --- Removed Paper import ---
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Link from '@mui/material/Link'; // MUI Link for non-router links
import ListItemButton from '@mui/material/ListItemButton';

// MUI Icon Imports
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// Mock data mirroring the screenshot
const classDetails = {
    id: "class789", // Add a mock class ID needed for navigation
    title: "RUN X LIFT Abs & Ass",
    duration: 50,
    dateTime: "Thursday, April 3, 2025 at 6:15 AM",
    instructor: "Instructor #1",
    location: "Seattle / Seattle",
    spot: "T-11",
    spotType: "Treadmill",
    paidWith: "Seattle - 5 Classes",
    // Use a placeholder or a real image URL if available
    instructorImage: "https://images.unsplash.com/photo-1554151228-14d9def656e4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmFjZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=100&q=60" // Example placeholder
};

const ClassDetailPage: React.FC = () => {
    const navigate = useNavigate(); // Hook for navigation actions

    // Mock handlers (some replaced with navigate or component props)
    const handleBack = () => navigate(-1); // Go back in history
    const handleShare = () => console.log("Share Action");
    const handleAddToCalendar = () => console.log("Add to Calendar Action");
    const handleViewChangeSpot = () => console.log("View/Change Spot Action");
    const handleBookGuest = () => console.log("Book a Guest Action");
    const handleBuyAddon = () => console.log("Buy Add-on Action");
    const handleCancelReservation = () => console.log("Cancel Reservation Action");
    const handleViewInstructorProfile = () => console.log("View Instructor Profile Action");
    // Suggest song is now handled via RouterLink component prop

    return (
        // Constrain width for a mobile-like view, disable gutters for edge-to-edge feel
        // Use Box instead of Container to prevent default padding if AppBar/Toolbar are inside
        <Box sx={{ maxWidth: 'sm', margin: 'auto', bgcolor: 'background.paper', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* 1. Top Navigation Bar */}
            {/* Ensure AppBar is outside the main scrollable content if it should be fixed */}
            <AppBar position="static" sx={{ bgcolor: 'black', color: 'white', boxShadow: 'none' }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" aria-label="back" onClick={handleBack}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
                    <IconButton color="inherit" aria-label="share" onClick={handleShare}>
                        <ShareIcon />
                    </IconButton>
                    <IconButton color="inherit" aria-label="add to calendar" onClick={handleAddToCalendar}>
                        <CalendarTodayIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* 2. Class Title & Info Block */}
            <Box sx={{ bgcolor: 'black', color: 'white', p: 2, pt: 1, pb: 3 }}>
                <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
                    {classDetails.title} ({classDetails.duration} min)
                </Typography>
                <Stack spacing={0.5}>
                    <Typography variant="body1" sx={{ fontSize: '0.9rem' }}>{classDetails.dateTime}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{classDetails.instructor}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{classDetails.location}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>{classDetails.duration} min.</Typography>
                </Stack>
            </Box>

            {/* Thin Divider between black and white sections */}
            <Divider sx={{ borderColor: 'grey.300' }}/>

            {/* 3. Main Content Area - Make this scrollable if content exceeds viewport */}
            <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}> {/* Added overflowY */}
                <Stack spacing={2}>

                    {/* Reservation Section */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Your Reservation:</Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Avatar sx={{
                                    bgcolor: '#d32f2f', // Barry's Red
                                    color: 'white',
                                    width: 48, height: 48,
                                    // Remove border for closer match to screenshot
                                    // border: '2px solid #d32f2f',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}>
                                    {classDetails.spot}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">Spot: {classDetails.spot}</Typography>
                                    <Typography variant="body2" color="text.secondary">{classDetails.spotType}</Typography>
                                </Box>
                            </Stack>
                            <Link
                                component="button" // Make it behave like a button
                                onClick={handleViewChangeSpot}
                                underline="none" // Remove underline
                                sx={{
                                    typography: 'body2', // Match font size
                                    color: 'text.primary', // Black text
                                    fontWeight: 'medium', // Match weight
                                    display: 'flex',
                                    alignItems: 'center',
                                    p: 0, // Remove padding if needed
                                    '& .MuiSvgIcon-root': { // Target the icon specifically
                                        color: 'grey.600', // Gray chevron
                                        ml: 0.2 // Slight margin left
                                    }
                                }}
                            >
                                View/Change Spot <ChevronRightIcon fontSize="small" />
                            </Link>
                        </Stack>
                        <Box>
                            <Typography variant="body1" fontWeight="bold">Paid With</Typography>
                            <Typography variant="body2" color="text.secondary">{classDetails.paidWith}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 1, borderColor: 'grey.200' }}/> {/* Lighter divider */}

                    {/* Action Rows */}
                    <List disablePadding sx={{ width: '100%' }}>
                        {/* Suggest Song Link Item */}
                         <ListItem disablePadding secondaryAction={<ChevronRightIcon sx={{ color: 'text.primary' }}/>}>
                             <ListItemButton
                                component={RouterLink} // Use RouterLink for navigation
                                to={`/suggest-song/${classDetails.id}`} // Navigate to suggest song page for this class
                                sx={{ py: 1.5 }} // Adjust padding to match others
                             >
                                <ListItemText
                                    primary={<Typography fontWeight="bold">Suggest a Song</Typography>}
                                    secondary="Help build the perfect playlist!" // Example secondary text
                                    secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.875rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                        <Divider component="li" /> {/* Use standard divider */}

                        {/* Book a Guest */}
                        <ListItem disablePadding secondaryAction={<ChevronRightIcon sx={{ color: 'text.primary' }}/>}>
                             <ListItemButton onClick={handleBookGuest} sx={{ py: 1.5 }}>
                                <ListItemText
                                    primary={<Typography fontWeight="bold">Book a Guest</Typography>}
                                    secondary="Classes are always better with friends."
                                    secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.875rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                        <Divider component="li" />

                        {/* Buy an Add-on */}
                        <ListItem disablePadding secondaryAction={<ChevronRightIcon sx={{ color: 'text.primary' }}/>}>
                            <ListItemButton onClick={handleBuyAddon} sx={{ py: 1.5 }}>
                                <ListItemText
                                    primary={<Typography fontWeight="bold">Buy an Add-on</Typography>}
                                    secondary="Skip the line and pre-order items you might want for class."
                                    secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.875rem' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    </List>

                     <Divider sx={{ my: 1, borderColor: 'grey.200' }}/>

                    {/* Cancel Reservation Button */}
                    <Button
                        variant="outlined"
                        onClick={handleCancelReservation}
                        fullWidth
                        sx={{
                            borderColor: 'grey.400', // Match screenshot border color
                            color: 'text.primary', // Match text color
                            borderRadius: '8px', // Match rounding
                            textTransform: 'none', // Match case
                            fontWeight: 'medium', // Match weight
                            py: 1, // Match vertical padding
                            my: 1,
                            '&:hover': {
                                borderColor: 'grey.500',
                                backgroundColor: 'action.hover' // Standard hover effect
                            },
                        }}
                    >
                        Cancel Reservation
                    </Button>

                    {/* Thick Divider */}
                    <Divider sx={{ my: 2, borderBottomWidth: '4px', bgcolor: 'grey.200' }} />

                    {/* Class Details Section (Instructor) */}
                    <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Class Details:</Typography>
                        <List disablePadding>
                            <ListItem disablePadding secondaryAction={<ChevronRightIcon sx={{ color: 'text.primary' }}/>}>
                                <ListItemButton onClick={handleViewInstructorProfile} sx={{ py: 1.5 }}>
                                    <ListItemAvatar>
                                        {/* Ensure Avatar is circular */}
                                        <Avatar alt={classDetails.instructor} src={classDetails.instructorImage} sx={{ width: 48, height: 48 }} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={<Typography fontWeight="bold">{classDetails.instructor}</Typography>}
                                        secondary="View Schedule & Profile"
                                        secondaryTypographyProps={{ color: 'text.secondary', fontSize: '0.875rem' }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </List>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
};

export default ClassDetailPage;