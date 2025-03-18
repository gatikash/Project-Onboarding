import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axios from 'axios';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/projects');
      console.log('Projects fetched:', response.data);
      setProjects(response.data);
    } catch (error) {
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Failed to fetch projects';
      setError(errorMessage);
      console.error('Error fetching projects:', error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
    } else {
      setEditingProject(null);
      setProjectName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProject(null);
    setProjectName('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (editingProject) {
        await axios.put(`http://localhost:3001/api/projects/${editingProject.id}`, {
          name: projectName
        });
        setSuccess('Project updated successfully');
      } else {
        await axios.post('http://localhost:3001/api/projects', {
          name: projectName
        });
        setSuccess('Project created successfully');
      }
      handleCloseDialog();
      fetchProjects();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save project');
      console.error('Error saving project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated resources.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:3001/api/projects/${projectId}`);
      setSuccess('Project deleted successfully');
      fetchProjects();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete project');
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Manage Projects
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Add New Project
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(project)}
                      disabled={loading}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(project.id)}
                      disabled={loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingProject ? 'Edit Project' : 'Add New Project'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading || !projectName.trim()}>
            {editingProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Projects; 