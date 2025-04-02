import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import axios from 'axios';

function Status() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projectStatus, setProjectStatus] = useState(null);
  const [userProgress, setUserProgress] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchStatus();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching projects...');
      const response = await axios.get('http://localhost:3001/api/projects');
      
      if (response.data.success) {
        console.log('Projects data:', response.data.projects);
        const projectsList = response.data.projects || [];
        setProjects(projectsList);
        
        if (projectsList.length > 0 && !selectedProject) {
          setSelectedProject(projectsList[0].id);
        }
      } else {
        console.error('Failed to fetch projects:', response.data.error);
        setError(response.data.error || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching status for project:', selectedProject);
      const response = await axios.get(`http://localhost:3001/api/status/${selectedProject}`);
      
      if (response.data.success) {
        console.log('Status data:', response.data);
        setProjectStatus(response.data.projectStatus);
        setUserProgress(response.data.userProgress || []);
      } else {
        console.error('Failed to fetch status:', response.data.error);
        setError(response.data.error || 'Failed to fetch status');
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (completed, total) => {
    if (total === 0) return 0;
    return (completed / total) * 100;
  };

  if (loading && !projects.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Status Overview
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
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
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Project Overview Section */}
            {projectStatus && (
              <Box sx={{ mb: 6 }}>
                <Typography variant="h5" gutterBottom>
                  Overall Project Progress
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={projectStatus.progress} 
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {projectStatus.completedTasks} of {projectStatus.totalTasks} tasks completed
                  </Typography>
                </Box>

                <TableContainer component={Paper} sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Task</TableCell>
                        <TableCell>Role</TableCell>
                        <TableCell>Assigned To</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectStatus.tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell>{task.task}</TableCell>
                          <TableCell>{task.role_name || 'All Roles'}</TableCell>
                          <TableCell>{task.assigned_to_email || 'Via Role'}</TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: task.status === 'completed' ? 'success.light' : 'warning.light',
                                color: task.status === 'completed' ? 'success.dark' : 'warning.dark',
                              }}
                            >
                              {task.status || 'pending'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* User Progress Section */}
            <Divider sx={{ mb: 4 }} />
            <Typography variant="h5" gutterBottom>
              User Progress
            </Typography>
            
            <Grid container spacing={3}>
              {userProgress.map((user) => (
                <Grid item xs={12} md={6} key={user.user_id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={3}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                          {user.email[0].toUpperCase()}
                        </Avatar>
                        <Box ml={2}>
                          <Typography variant="h6">
                            {user.email}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.role_name}
                          </Typography>
                        </Box>
                      </Box>

                      <Box mb={3}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="body2" color="textSecondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {user.completed_tasks} of {user.total_tasks} tasks
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgress(user.completed_tasks, user.total_tasks)}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              bgcolor: 'success.light',
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="h4" color="success.dark">
                              {user.completed_tasks}
                            </Typography>
                            <Typography variant="body2" color="success.dark">
                              Completed
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              bgcolor: 'warning.light',
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="h4" color="warning.dark">
                              {user.pending_tasks}
                            </Typography>
                            <Typography variant="body2" color="warning.dark">
                              Pending
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {user.pending_tasks > 0 && user.pending_tasks_list && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Pending Tasks
                          </Typography>
                          {user.pending_tasks_list.map((task, index) => (
                            <Box
                              key={index}
                              sx={{
                                p: 1.5,
                                mb: 1,
                                bgcolor: 'grey.100',
                                borderRadius: 1
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: 'warning.main',
                                    mr: 2
                                  }}
                                />
                                <Typography variant="body2">
                                  {task.task_description}
                                </Typography>
                              </Box>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  ml: 3,
                                  color: 'text.secondary',
                                  display: 'block'
                                }}
                              >
                                {task.assignment_type}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default Status; 