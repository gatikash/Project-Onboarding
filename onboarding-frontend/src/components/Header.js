import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container
} from '@mui/material';
import { styled } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  marginBottom: theme.spacing(3),
}));

function Header({ userEmail, onLogout }) {
  const navigate = useNavigate();

  return (
    <StyledAppBar position="static">
      <Container maxWidth="lg">
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Button
              color="inherit"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/dashboard')}
              sx={{ mr: 2 }}
            >
              Home
            </Button>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Onboarding Portal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ color: 'white' }}>
              {userEmail}
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{
                color: 'red',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.93)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
}

export default Header; 