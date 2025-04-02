import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Button,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  styled,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Description as DescriptionIcon,
  People as PeopleIcon,
  PlaylistAddCheck as ChecklistIcon,
  AssignmentTurnedIn as TasksIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StyledLogoutButton = styled(Button)({
  color: '#fff',
  backgroundColor: '#dc3545',  // Bootstrap danger red
  borderColor: '#dc3545',
  boxShadow: '0 2px 4px rgba(220, 53, 69, 0.2)',
  '&:hover': {
    backgroundColor: '#fff',
    color: '#dc3545',
    borderColor: '#dc3545',
    boxShadow: '0 4px 8px rgba(220, 53, 69, 0.3)',
  },
  borderRadius: '6px',
  textTransform: 'none',
  padding: '8px 16px',
  marginLeft: '8px',
  transition: 'all 0.2s ease-in-out',
  fontWeight: 500,
  '& .MuiSvgIcon-root': {
    marginRight: '4px',
  },
});

function Header() {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const roleName = localStorage.getItem('roleName');
  const userEmail = localStorage.getItem('userEmail');
  const isManager = roleName === 'MANAGER';

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    handleCloseNavMenu();
    setDrawerOpen(false);
  };

  const handleLogout = async () => {
    try {
      // Clear all user-related data from localStorage
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('roleName');
      localStorage.removeItem('token');
      localStorage.removeItem('userRoleId');
      
      // Close any open menus or drawers
      setAnchorElNav(null);
      setDrawerOpen(false);
      
      // Force a navigation to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <HomeIcon />, 
      path: isManager ? '/manager-dashboard' : '/user-dashboard' 
    },
    { text: 'Resources', icon: <DescriptionIcon />, path: '/resources' },
    { text: 'My Checklist', icon: <ChecklistIcon />, path: '/checklist' },
  ];

  if (isManager) {
    menuItems.push(
      { text: 'User Master', icon: <PeopleIcon />, path: '/users' },
      { text: 'User Tasks', icon: <TasksIcon />, path: '/user-tasks' }
    );
  }

  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        <Divider />
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <IconButton
              color="inherit"
              onClick={() => handleNavigation(isManager ? '/manager-dashboard' : '/user-dashboard')}
              sx={{ mr: 1 }}
              title="Go to Dashboard"
            >
              <HomeIcon />
            </IconButton>
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}
            >
              Onboarding Portal
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                {userEmail}
              </Typography>
              <StyledLogoutButton
                variant="outlined"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
              >
                Logout
              </StyledLogoutButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Header; 