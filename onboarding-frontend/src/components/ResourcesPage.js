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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Link as LinkIcon,
  Description as FileIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import axios from 'axios';

function ResourcesPage() {
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    file_path: '',
    file_type: 'link', // 'link' or 'file'
    file: null, // for file upload
  });

  // Fetch projects and roles on component mount
  useEffect(() => {
    fetchProjects();
    fetchRoles();
  }, []);

  // Fetch resources when project or role changes
  useEffect(() => {
    if (selectedProject && selectedRole) {
      fetchResources();
    }
  }, [selectedProject, selectedRole]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/roles');
      if (response.data.success) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      setError('Failed to fetch roles');
      console.error('Error fetching roles:', error);
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/resources/${selectedProject}?roleId=${selectedRole}`);
      if (response.data.success) {
        setResources(response.data.resources);
      }
    } catch (error) {
      setError('Failed to fetch resources');
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResource = async () => {
    if (!selectedProject || !selectedRole) {
      setError('Please select a project and role first');
      return;
    }

    if (!newResource.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', newResource.title.trim());
      formData.append('description', newResource.description.trim());
      formData.append('projectId', selectedProject);
      formData.append('roleId', selectedRole);

      if (newResource.file_type === 'link') {
        if (!newResource.file_path.trim()) {
          setError('Please enter a valid URL');
          setLoading(false);
          return;
        }
        formData.append('file_path', newResource.file_path.trim());
      } else {
        if (!newResource.file) {
          setError('Please select a file to upload');
          setLoading(false);
          return;
        }
        formData.append('file', newResource.file);
      }

      console.log('Submitting resource:', {
        title: newResource.title,
        description: newResource.description,
        projectId: selectedProject,
        roleId: selectedRole,
        fileType: newResource.file_type,
        fileName: newResource.file?.name
      });

      const response = await axios.post('http://localhost:3001/api/resources', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess('Resource added successfully');
        setOpenDialog(false);
        setNewResource({
          title: '',
          description: '',
          file_path: '',
          file_type: 'link',
          file: null,
        });
        await fetchResources();
      } else {
        throw new Error(response.data.error || 'Failed to add resource');
      }
    } catch (error) {
      console.error('Error adding resource:', error);
      setError(error.response?.data?.error || error.message || 'Failed to add resource');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
        setError('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.');
        event.target.value = ''; // Clear the file input
        return;
      }
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        event.target.value = ''; // Clear the file input
        return;
      }
      setNewResource({ ...newResource, file: file });
      setError(''); // Clear any previous errors
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Manage Resources
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 4 }}>
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
                <InputLabel>Select Role</InputLabel>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  label="Select Role"
                  disabled={!selectedProject}
                >
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
                onClick={() => setOpenDialog(true)}
                disabled={!selectedProject || !selectedRole}
                fullWidth
                sx={{ height: '56px' }}
              >
                Add Resource
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {resources.map((resource) => (
                <Grid item xs={12} md={6} lg={4} key={resource.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {resource.file_type === 'link' ? <LinkIcon /> : <FileIcon />}
                        <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                          {resource.title}
                        </Typography>
                      </Box>
                      <Typography color="textSecondary" gutterBottom>
                        {resource.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        color="primary"
                        href={resource.file_type === 'link' ? resource.file_path : `http://localhost:3001/uploads/${resource.file_path}`}
                        target="_blank"
                        startIcon={resource.file_type === 'link' ? <LinkIcon /> : <FileIcon />}
                      >
                        {resource.file_type === 'link' ? 'Open Link' : 'Download'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Add Resource Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Resource</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={newResource.title}
              onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={newResource.description}
              onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Resource Type</InputLabel>
              <Select
                value={newResource.file_type}
                onChange={(e) => {
                  setNewResource({
                    ...newResource,
                    file_type: e.target.value,
                    file_path: '',
                    file: null,
                  });
                }}
                label="Resource Type"
              >
                <MenuItem value="link">Link</MenuItem>
                <MenuItem value="file">File Upload</MenuItem>
              </Select>
            </FormControl>
            {newResource.file_type === 'link' ? (
              <TextField
                fullWidth
                label="URL"
                value={newResource.file_path}
                onChange={(e) => setNewResource({ ...newResource, file_path: e.target.value })}
                margin="normal"
                placeholder="https://example.com"
              />
            ) : (
              <Box sx={{ mt: 2 }}>
                <input
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    {newResource.file ? newResource.file.name : 'Choose File'}
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Allowed file types: PDF, DOC, DOCX, TXT (Max size: 10MB)
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddResource}
            variant="contained"
            disabled={!newResource.title || (!newResource.file_path && !newResource.file)}
          >
            Add Resource
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
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

export default ResourcesPage; 