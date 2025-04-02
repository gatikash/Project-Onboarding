import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Container, Typography } from '@mui/material';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const managerCredentials = { email: "manager@example.com", password: "manager123" };
    const userCredentials = { email: "user@example.com", password: "user123" };

    if (email === managerCredentials.email && password === managerCredentials.password) {
      console.log('Manager login successful');
      navigate('/dashboard');
    } else if (email === userCredentials.email && password === userCredentials.password) {
      console.log('User login successful');
      navigate('/dashboard');
    } else {
      console.log('Invalid email or password');
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Login
      </Typography>
      <TextField
        label="Email"
        variant="outlined"
        fullWidth
        margin="normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        variant="outlined"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Login
      </Button>
    </Container>
  );
}

export default LoginPage; 