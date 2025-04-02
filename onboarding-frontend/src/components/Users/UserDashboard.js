import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  styled,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  PlaylistAddCheck as ChecklistIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1, 2),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: '#1976d2',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
}));

function UserDashboard() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');
  const userRoleId = localStorage.getItem('userRoleId');
  const isManager = userRoleId === '1';

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleHomeClick = () => {
    navigate(isManager ? '/manager-dashboard' : '/user-dashboard');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Employee Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Welcome, {userEmail}
          </Typography>
        </Box>
        <StyledButton
          variant="contained"
          startIcon={<HomeIcon />}
          onClick={handleHomeClick}
        >
          Back to {isManager ? 'Manager' : 'User'} Dashboard
        </StyledButton>
      </Box>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Resources Card */}

        <Grid item xs={12} sm={6}>
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
              View and complete your tasks
            </Typography>
          </Paper>
        </Grid>
        
        {/* My Checklist Card */}
        <Grid item xs={12} sm={6}>
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
              Access onboarding materials
            </Typography>
          </Paper>
        </Grid>

        
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body1" component="div">
          • Review your assigned tasks in My Checklist
          <br />
          • Access training materials in Resources
          <br />
          • Complete tasks in order of priority
          <br />
          • Track your onboarding progress
        </Typography>
      </Box>
    </Container>
  );
}

export default UserDashboard; 