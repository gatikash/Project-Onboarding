import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  List, 
  ListItem, 
  ListItemText, 
  Button, 
  TextField, 
  Container, 
  Typography, 
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName) return;
    try {
      await axios.post('http://localhost:3001/api/projects', { name: newProjectName });
      setNewProjectName('');
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/projects/${id}`);
      fetchProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editProjectName || !editingProject) return;
    try {
      await axios.put(`http://localhost:3001/api/projects/${editingProject.id}`, { name: editProjectName });
      setEditDialogOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Project Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="New Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddProject}
            startIcon={<AddIcon />}
            disabled={!newProjectName}
          >
            Add Project
          </Button>
        </Box>

        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid item xs={12} key={project.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{project.name}</Typography>
                    <Box>
                      <IconButton 
                        color="primary" 
                        onClick={() => handleEditClick(project)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteProject(project.id)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={editProjectName}
            onChange={(e) => setEditProjectName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ProjectManager; 