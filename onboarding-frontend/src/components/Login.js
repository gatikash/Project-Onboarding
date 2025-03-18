import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: theme.spacing(8),
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

const Form = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}));

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simple validation
      if (!formData.email || !formData.password) {
        throw new Error('Please fill in all fields');
      }

      // Make API call to validate credentials
      const response = await axios.post('http://localhost:3001/api/auth/login', formData);

      if (response.data.success) {
        const { user } = response.data;
        onLogin({
          email: user.email,
          role: user.role.toUpperCase(),
          id: user.id
        });
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <StyledPaper elevation={3}>
        <Typography component="h1" variant="h4" gutterBottom>
          Welcome Back
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 3 }}>
          Sign in to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
                color: 'white',
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
                color: 'white',
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: 'white',
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              bgcolor: 'white',
              color: '#2196f3',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="primary" />
            ) : (
              'Sign In'
            )}
          </Button>
        </Form>
      </StyledPaper>
    </Container>
  );
}

export default Login; 