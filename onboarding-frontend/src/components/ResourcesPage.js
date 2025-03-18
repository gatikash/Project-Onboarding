import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import Resources from './Resources';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

function ResourcesPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/projects');
      setProjects(response.data);
      // If there's only one project, select it automatically
      if (response.data.length === 1) {
        setSelectedProject(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper elevation={3}>
        <Typography variant="h4" gutterBottom>
          Project Resources
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Access and view resources for your assigned projects
        </Typography>
      </StyledPaper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ p: 3 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Project</InputLabel>
            <Select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              label="Select Project"
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedProject && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Project Resources
              </Typography>
              <Resources projectId={selectedProject} isManager={false} />
            </Box>
          )}
        </Paper>
      )}
    </Container>
  );
}

export default ResourcesPage; 