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
  CircularProgress,
  Chip,
  Tab,
  Tabs,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Resources from './Resources';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

function ManagerChecklist() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [openAddTask, setOpenAddTask] = useState(false);
  const [openAddProject, setOpenAddProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [taskName, setTaskName] = useState('');
  const [newTask, setNewTask] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchTasks = async (projectId) => {
    if (!projectId) {
      setTasks([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching tasks for project:', projectId);
      const response = await axios.get(`http://localhost:3001/api/checklist/manager?projectId=${projectId}`);
      console.log('Tasks fetched:', response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.response?.data?.error || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) {
      console.log('Selected project changed:', selectedProject);
      fetchTasks(selectedProject);
    } else {
      setTasks([]);
    }
  }, [selectedProject]);

  const handleAddProject = async () => {
    try {
      await axios.post('http://localhost:3001/api/projects', newProject);
      fetchProjects();
      setOpenAddProject(false);
      setNewProject({ name: '' });
    } catch (error) {
      console.error('Error adding project:', error);
      setError('Failed to add project');
    }
  };

  const handleMenuClick = (event, task) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTask(null);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await axios.delete(`http://localhost:3001/api/checklist/${selectedTask.id}`);
      setTasks(tasks.filter(task => task.id !== selectedTask.id));
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    setOpenAddTask(false);
    setTaskName('');
    setSelectedProject('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/checklist', {
        task: newTask,
        projectId: selectedProject,
        status: 'pending'
      });

      setTasks([response.data, ...tasks]);
      setNewTask('');
      setSuccess('Task added successfully');
      setOpenAddTask(false);
    } catch (error) {
      setError('Failed to add task');
      console.error('Error adding task:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      await axios.delete(`http://localhost:3001/api/projects/${projectId}`);
      
      // Clear selected project if it was deleted
      if (selectedProject === projectId) {
        setSelectedProject('');
        setTasks([]);
      }
      
      // Refresh projects list
      fetchProjects();
      setSuccess('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      setError(error.response?.data?.error || 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.put(`http://localhost:3001/api/checklist/${taskId}`, { status: newStatus });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      setError('Failed to update task status');
    }
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Project Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddProject(true)}
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            Add Project
          </Button>
        </Box>
      </StyledPaper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Project</InputLabel>
          <Select
            value={selectedProject}
            label="Select Project"
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedProject && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddTask(true)}
                sx={{ mr: 2 }}
              >
                Add Task
              </Button>
            </Box>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="All Tasks" />
              <Tab label="Pending" />
              <Tab label="Completed" />
            </Tabs>
          </Box>
        )}

        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                    onChange={() => handleStatusChange(task.id, task.status === 'complete' ? 'pending' : 'complete')}
                    color="primary"
                    disabled
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
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={task.status}
                      size="small"
                      color={task.status === 'complete' ? 'success' : 'default'}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={(e) => handleMenuClick(e, task)}>
                  <MoreVertIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {selectedProject && <Resources projectId={selectedProject} isManager={true} />}

      <Dialog open={openAddTask} onClose={handleClose}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            fullWidth
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            required
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="project-select-label">Project</InputLabel>
            <Select
              labelId="project-select-label"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              required
            >
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddProject} onClose={() => setOpenAddProject(false)}>
        <DialogTitle>Add New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={newProject.name}
            onChange={(e) => setNewProject({ name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddProject(false)}>Cancel</Button>
          <Button onClick={handleAddProject} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDeleteTask}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Container>
  );
}

export default ManagerChecklist; 