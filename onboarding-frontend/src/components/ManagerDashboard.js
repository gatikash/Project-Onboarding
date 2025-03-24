import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  styled,
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Task as TaskIcon,
  Folder as FolderIcon,
  Group as GroupIcon,
  AccountCircle as AccountIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

const WelcomePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
  color: 'white',
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 60%)',
  }
}));

const StyledCard = styled(Card)(({ theme, bgcolor }) => ({
  height: '100%',
  background: `linear-gradient(135deg, ${bgcolor} 0%, ${bgcolor}dd 100%)`,
  color: 'white',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
    '& .arrow-icon': {
      transform: 'translateX(4px)',
    }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2) 0%, transparent 60%)',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover::before': {
    opacity: 1,
  }
}));

const CardOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: 'inherit',
});

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 48,
  height: 48,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  marginBottom: theme.spacing(2),
  '& svg': {
    fontSize: 28,
  },
}));

const StyledArrowIcon = styled(ArrowForwardIcon)({
  transition: 'transform 0.3s ease-in-out',
  marginLeft: 'auto',
});

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail');

  const cards = [
    {
      title: 'Checklist',
      description: 'View and manage your checklist items',
      icon: <AssignmentIcon />,
      path: '/manager-checklist',
      color: '#1976d2'
    },
    {
      title: 'Project Resources',
      description: 'Access manager-specific resources and documents',
      icon: <FolderIcon />,
      path: '/manager-resources',
      color: '#2e7d32'
    },
    {
      title: 'Manage Projects',
      description: 'Manage projects and team assignments',
      icon: <TaskIcon />,
      path: '/projects',
      color: '#ed6c02'
    },
    {
      title: 'Manage Users',
      description: 'Manage users and their roles',
      icon: <PeopleIcon />,
      path: '/users',
      color: '#9c27b0'
    },
    {
      title: 'User Tasks Status',
      description: 'View and manage tasks assigned to users',
      icon: <GroupIcon />,
      path: '/user-tasks',
      color: '#d32f2f'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <WelcomePaper elevation={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}>
            <AccountIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ 
              fontWeight: 600,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Welcome back!
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {userEmail}
            </Typography>
          </Box>
        </Box>
      </WelcomePaper>

      <Grid container spacing={3}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <StyledCard 
              onClick={() => navigate(card.path)}
              bgcolor={card.color}
              elevation={3}
            >
              <CardOverlay />
              <CardContent sx={{ 
                position: 'relative',
                zIndex: 1,
                height: '100%',
                p: 3,
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <StyledAvatar>
                    {card.icon}
                  </StyledAvatar>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.9,
                    mb: 2,
                    flex: 1
                  }}>
                    {card.description}
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mt: 'auto'
                  }}>
                    <Typography variant="button" sx={{ 
                      fontWeight: 500,
                      opacity: 0.9
                    }}>
                      Access Now
                    </Typography>
                    <StyledArrowIcon className="arrow-icon" />
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default ManagerDashboard; 