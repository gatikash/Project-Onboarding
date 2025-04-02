import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box
} from '@mui/material';
import {
  Description as DescriptionIcon,
  People as PeopleIcon,
  PlaylistAddCheck as ChecklistIcon,
  AssignmentTurnedIn as TasksIcon
} from '@mui/icons-material';

function Dashboard() {
  const navigate = useNavigate();
  const roleName = localStorage.getItem('roleName');
  const isManager = roleName === 'MANAGER';

  const handleCardClick = (route) => {
    navigate(route);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" gutterBottom>
        Welcome to Your Dashboard
      </Typography>
      <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        {isManager ? 'Manager Dashboard' : 'Employee Dashboard'} - Track your onboarding progress
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Resources Card - Visible to all */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              bgcolor: '#9c27b0',
              color: 'white',
              '&:hover': {
                bgcolor: '#7b1fa2',
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease-in-out',
              },
            }}
            onClick={() => handleCardClick('/resources')}
          >
            <DescriptionIcon sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              Resources
            </Typography>
            <Typography variant="body2" align="center">
              Access onboarding resources and materials
            </Typography>
          </Paper>
        </Grid>

        {/* User Checklist Card - Visible to all */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              bgcolor: '#2196f3',
              color: 'white',
              '&:hover': {
                bgcolor: '#1976d2',
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease-in-out',
              },
            }}
            onClick={() => handleCardClick('/checklist')}
          >
            <ChecklistIcon sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h5" component="h2" gutterBottom>
              My Checklist
            </Typography>
            <Typography variant="body2" align="center">
              View and manage your tasks
            </Typography>
          </Paper>
        </Grid>

        {/* Manager-only cards */}
        {isManager && (
          <>
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: '#4caf50',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#388e3c',
                    transform: 'scale(1.02)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
                onClick={() => handleCardClick('/users')}
              >
                <PeopleIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  User Master
                </Typography>
                <Typography variant="body2" align="center">
                  Manage users and their roles
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  bgcolor: '#ff9800',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#f57c00',
                    transform: 'scale(1.02)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
                onClick={() => handleCardClick('/user-tasks')}
              >
                <TasksIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" component="h2" gutterBottom>
                  User Tasks
                </Typography>
                <Typography variant="body2" align="center">
                  Manage and track user tasks
                </Typography>
              </Paper>
            </Grid>
          </>
        )}
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Quick Tips
        </Typography>
        <Typography variant="body1" component="div">
          • Complete your profile information
          <br />
          • Review the onboarding checklist
          <br />
          • Connect with your team members
        </Typography>
      </Box>
    </Container>
  );
}

export default Dashboard; 