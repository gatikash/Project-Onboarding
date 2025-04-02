import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ManageChecklistResources from './ManageChecklistResources';

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
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [openAddTask, setOpenAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      console.log('Fetching roles...');
      const response = await axios.get('http://localhost:3001/api/roles');
      console.log('Roles response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.roles)) {
        setRoles(response.data.roles);
      } else {
        console.error('Invalid roles response format:', response.data);
        setError('Failed to fetch roles: Invalid response format');
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error.response || error);
      setError(error.response?.data?.error || 'Failed to fetch roles');
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      console.log('Fetching projects...');
      const response = await axios.get('http://localhost:3001/api/projects');
      console.log('Projects response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.projects)) {
        console.log('Setting projects:', response.data.projects);
        setProjects(response.data.projects);
        // Auto-select first project if none selected and projects exist
        if (response.data.projects.length > 0 && !selectedProject) {
          const firstProject = response.data.projects[0];
          console.log('Auto-selecting first project:', firstProject);
          setSelectedProject(firstProject.id);
        }
      } else {
        console.error('Invalid projects response format:', response.data);
        setError('Failed to fetch projects: Invalid response format');
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error.response || error);
      setError(error.response?.data?.error || 'Failed to fetch projects');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Initial data fetch...');
    Promise.all([fetchProjects(), fetchRoles()])
      .catch(error => {
        console.error('Error in initial data fetch:', error);
        setError('Failed to load initial data');
      });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      console.log('Selected project or role filter changed:', selectedProject, selectedRole);
      fetchTasks();
    }
  }, [selectedProject, selectedRole]);

  const fetchTasks = async () => {
    if (!selectedProject) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:3001/api/checklist/manager`, {
        params: {
          projectId: selectedProject,
          roleId: selectedRole === 'all' ? null : selectedRole
        }
      });
      
      if (response.data.success && Array.isArray(response.data.tasks)) {
        setTasks(response.data.tasks);
      } else {
        setError('Failed to fetch tasks: Invalid response format');
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error.response?.data?.error || 'Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:3001/api/checklist/${taskId}`);
      setTasks(tasks.filter(task => task.id !== taskId));
      setSuccess('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      setError('Please select a project first');
      return;
    }
    if (!selectedRole || selectedRole === 'all') {
      setError('Please select a valid role for the task');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/checklist', {
        task: newTask,
        projectId: selectedProject,
        roleId: selectedRole
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper elevation={3}>
        <Typography variant="h4" gutterBottom>
          Project Management
        </Typography>
      </StyledPaper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Project</InputLabel>
              <Select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                label="Select Project"
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                label="Filter by Role"
              >
                <MenuItem value="all">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.role_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddTask(true)}
              disabled={!selectedProject}
              fullWidth
              sx={{ height: '56px' }}
            >
              Add Task
            </Button>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>{task.task}</TableCell>
                      <TableCell>{task.role_name}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleDeleteTask(task.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </>
        )}

        {/* Add Manager Resources Section */}
        <Box sx={{ mt: 4 }}>
          <br></br>
          <br></br>
          {selectedProject ? (
            <ManageChecklistResources projectId={selectedProject} />
          ) : (
            <Alert severity="info">
              Please select a project to view resources
            </Alert>
          )}
        </Box>
      </Paper>

      {/* Add Task Dialog */}
      <Dialog open={openAddTask} onClose={() => setOpenAddTask(false)}>
        <DialogTitle>Add New Task</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Task Description"
              fullWidth
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAddTask(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Add Task
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default ManagerChecklist; 