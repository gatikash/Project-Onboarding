import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Checklist as ChecklistIcon,
  Folder as FolderIcon,
  Group as GroupIcon,
  Lightbulb as LightbulbIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!role) {
      navigate('/');
      return;
    }
    setUserRole(role);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    navigate('/');
  };

  const getBaseDashboardItems = () => {
    const items = [
      {
        title: 'Onboarding Checklist',
        description: 'Track your progress through the onboarding process with our comprehensive checklist.',
        icon: <ChecklistIcon sx={{ fontSize: 40 }} />,
        path: userRole === 'MANAGER' ? '/manager-checklist' : '/checklist',
        color: '#2196f3'
      },
      {
        title: 'Resources',
        description: 'Access project-specific resources and materials',
        icon: <GroupIcon sx={{ fontSize: 40 }} />,
        path: '/resources',
        color: '#ff9800'
      }
    ];

    // Add Projects card only for MANAGER role
    if (userRole === 'MANAGER') {
      items.splice(1, 0, {
        title: 'Projects',
        description: 'View and manage your assigned projects and tasks.',
        icon: <FolderIcon sx={{ fontSize: 40 }} />,
        path: '/projects',
        color: '#4caf50'
      });
    }

    return items;
  };

  if (!userRole) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
          color: 'white',
          borderRadius: 2,
          mb: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h3" gutterBottom>
            Welcome to Your Dashboard
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Your central hub for managing onboarding tasks and resources
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {getBaseDashboardItems().map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: `${item.color}20`,
                      mr: 2
                    }}
                  >
                    <Box sx={{ color: item.color }}>
                      {item.icon}
                    </Box>
                  </Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    {item.title}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {item.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: item.color,
                    borderColor: item.color,
                    '&:hover': {
                      borderColor: item.color,
                      backgroundColor: `${item.color}10`
                    }
                  }}
                >
                  Access {item.title}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mt: 4,
          background: 'linear-gradient(45deg, #f5f5f5 30%, #ffffff 90%)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <LightbulbIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            Quick Tips
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              • Complete your profile information
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              • Review the onboarding checklist
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              • Connect with your team members
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Dashboard; 