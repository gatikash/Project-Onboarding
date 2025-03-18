import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  Checkbox,
  Box,
  LinearProgress,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

function Checklist() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks(selectedProject);
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

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
    }
  };

  const fetchTasks = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }
      const response = await axios.get(`http://localhost:3001/api/checklist?projectId=${projectId}`, {
        headers: {
          'user-id': userId
        }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'complete' ? 'pending' : 'complete';
      console.log('Updating task status:', { id, newStatus });
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found. Please log in again.');
        return;
      }
      const response = await axios.put(`http://localhost:3001/api/checklist/${id}`, {
        status: newStatus
      }, {
        headers: {
          'user-id': userId
        }
      });

      if (response.status === 200) {
        // Update the task in the local state
        setTasks(tasks.map(task => 
          task.id === id ? { ...task, status: newStatus } : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to update task. Please try again.';
      setError(errorMessage);
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'complete').length;
    return (completedTasks / tasks.length) * 100;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filteredTasks = tasks.filter(task => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return task.status === 'pending';
    if (tabValue === 2) return task.status === 'complete';
    return true;
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper elevation={3}>
        <Typography variant="h4" gutterBottom>
          My Onboarding Checklist
        </Typography>
        <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
          Track your onboarding progress
        </Typography>
      </StyledPaper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            My Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={calculateProgress()} 
            sx={{ height: 10, borderRadius: 5 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {tasks.filter(task => task.status === 'complete').length} of {tasks.length} tasks completed
          </Typography>
        </Box>

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

        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="All Tasks" />
          <Tab label="Pending" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : selectedProject ? (
        <List>
          {filteredTasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={task.status === 'complete'}
                  onChange={() => handleToggleTask(task.id, task.status)}
                  color="primary"
                />
              </ListItemIcon>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    textDecoration: task.status === 'complete' ? 'line-through' : 'none',
                    color: task.status === 'complete' ? 'text.secondary' : 'text.primary'
                  }}
                >
                  {task.task}
                </Typography>
                {task.description && (
                  <Typography variant="body2" color="text.secondary">
                    {task.description}
                  </Typography>
                )}
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={task.project_name || 'No Project'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={task.status}
                    size="small"
                    color={task.status === 'complete' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Please select a project to view your tasks
          </Typography>
        </Paper>
      )}
    </Container>
  );
}

export default Checklist; 