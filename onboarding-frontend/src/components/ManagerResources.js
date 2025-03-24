import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Link as LinkIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Image as ImageIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

const ResourceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
  borderRadius: theme.spacing(1),
  overflow: 'visible'
}));

const ResourceCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2.5),
  '&:last-child': {
    paddingBottom: theme.spacing(2),
  },
}));

const ResourceTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.1rem',
  fontWeight: 500,
  marginLeft: theme.spacing(1.5),
  color: theme.palette.text.primary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ResourceDescription = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: '0.875rem',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  minHeight: '40px',
  display: '-webkit-box',
  '-webkit-line-clamp': 2,
  '-webkit-box-orient': 'vertical',
  overflow: 'hidden',
}));

const ResourceIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& > svg': {
    fontSize: 24,
    color: theme.palette.primary.main,
  },
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  padding: theme.spacing(0.75, 2),
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  },
}));

// Add VisuallyHiddenInput styled component
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ManagerResources = () => {
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: '',
    category: '',
    file_url: '',
    status: 'active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resourceType, setResourceType] = useState('link');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchResources();
    }
  }, [selectedProject, selectedRole]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('http://localhost:3001/api/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
        // Auto-select first project if available
        if (response.data.projects.length > 0) {
          setSelectedProject(response.data.projects[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects');
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
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Failed to fetch roles');
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:3001/api/resources/${selectedProject}`, {
        params: {
          roleId: selectedRole === 'all' ? null : selectedRole
        }
      });
      if (response.data.success) {
        setResources(response.data.resources);
      } else {
        setError('Failed to fetch resources');
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (resource = null) => {
    if (resource) {
      setEditMode(true);
      setSelectedResource(resource);
      setResourceType(resource.file_type === 'link' ? 'link' : 'file');
      setFormData({
        title: resource.title,
        description: resource.description || '',
        project_id: resource.project_id.toString(),
        role_id: resource.role_id.toString(),
        file_path: resource.file_path || '',
        file_type: resource.file_type || ''
      });
    } else {
      setEditMode(false);
      setSelectedResource(null);
      setResourceType('link');
      setSelectedFile(null);
      setFormData({
        title: '',
        description: '',
        project_id: selectedProject || '',
        role_id: '',
        file_path: '',
        file_type: ''
      });
    }
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Debug log for form data
      console.log('Form Data before submission:', {
        title: formData.title,
        projectId: formData.project_id,
        roleId: formData.role_id,
        description: formData.description,
        file_path: formData.file_path,
        file_type: formData.file_type
      });

      // Validate required fields
      if (!formData.title || !formData.project_id || !formData.role_id) {
        console.log('Validation failed:', {
          hasTitle: Boolean(formData.title),
          hasProjectId: Boolean(formData.project_id),
          hasRoleId: Boolean(formData.role_id)
        });
        setError('Title, Project, and Role are required fields');
        return;
      }

      if (resourceType === 'file' && selectedFile) {
        const formDataWithFile = new FormData();
        formDataWithFile.append('file', selectedFile);
        formDataWithFile.append('title', formData.title.trim());
        formDataWithFile.append('description', formData.description || '');
        formDataWithFile.append('projectId', formData.project_id);
        formDataWithFile.append('roleId', formData.role_id);
        
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        formDataWithFile.append('file_type', fileExtension);

        // Debug log for file submission
        for (let pair of formDataWithFile.entries()) {
          console.log(pair[0] + ': ' + pair[1]);
        }

        try {
          const response = await axios.post(
            'http://localhost:3001/api/resources', 
            formDataWithFile,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          
          if (response.data.success) {
            setSuccess('Resource created successfully');
            fetchResources();
            handleClose();
          } else {
            console.error('Server response error:', response.data);
            setError(response.data.error || 'Failed to create resource');
          }
        } catch (err) {
          console.error('Error uploading file:', err.response?.data || err);
          setError(err.response?.data?.error || 'Failed to upload file');
        }
      } else {
        // For link type resources
        if (!formData.file_path) {
          setError('Resource URL is required for link type resources');
          return;
        }

        const linkData = {
          title: formData.title.trim(),
          description: formData.description || '',
          projectId: formData.project_id,
          roleId: formData.role_id,
          file_path: formData.file_path,
          file_type: 'link'
        };

        // Debug log for link submission
        console.log('Submitting link data:', linkData);

        try {
          const response = await axios.post(
            'http://localhost:3001/api/resources',
            linkData
          );
          
          if (response.data.success) {
            setSuccess('Resource created successfully');
            fetchResources();
            handleClose();
          } else {
            console.error('Server response error:', response.data);
            setError(response.data.error || 'Failed to create resource');
          }
        } catch (err) {
          console.error('Error creating link resource:', err.response?.data || err);
          setError(err.response?.data?.error || 'Failed to create resource');
        }
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('Failed to save resource. Please try again.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const fileExtension = file.name.split('.').pop().toLowerCase();
      setFormData({
        ...formData,
        file_type: fileExtension,
        title: file.name.split('.')[0],
      });
    }
  };

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const response = await axios.delete(`http://localhost:3001/api/resources/${resourceId}`);
        if (response.data.success) {
          setSuccess('Resource deleted successfully');
          fetchResources();
        }
      } catch (err) {
        console.error('Error deleting resource:', err);
        setError('Failed to delete resource');
      }
    }
  };

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <DocumentIcon />;
      case 'link':
        return <LinkIcon />;
      case 'video':
        return <VideoIcon />;
      case 'image':
        return <ImageIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const handleDownload = (resource) => {
    console.log('Downloading resource:', resource);
    if (resource.file_type?.toLowerCase() === 'link') {
      window.open(resource.file_path, '_blank');
    } else {
      const fileUrl = `http://localhost:3001/uploads/${resource.file_path}`;
      console.log('Opening file URL:', fileUrl);
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Project Resources
          </Typography>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/manager-dashboard')}
            startIcon={<ArrowBackIcon />}
            sx={{ 
              borderColor: 'rgba(255, 255, 255, 0.5)',
              color: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
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
              onClick={() => handleOpen()}
              disabled={!selectedProject}
              fullWidth
              sx={{ height: '56px' }}
            >
              Add Resource
            </Button>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : !resources || resources.length === 0 ? (
          <Alert severity="info">
            No resources available for {selectedRole === 'all' ? 'any role' : 'the selected role'} in this project.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {resources.map((resource) => (
              <Grid item xs={12} sm={6} md={4} key={resource.id}>
                <ResourceCard>
                  <ResourceCardContent>
                    <Box display="flex" alignItems="center">
                      <ResourceIconWrapper>
                        {getResourceIcon(resource.file_type)}
                      </ResourceIconWrapper>
                      <ResourceTitle>
                        {resource.title}
                      </ResourceTitle>
                    </Box>
                    <ResourceDescription>
                      {resource.description}
                    </ResourceDescription>
                    {resource.category && (
                      <Chip
                        label={resource.category}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    )}
                    <DownloadButton
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(resource)}
                      fullWidth
                    >
                      {resource.file_type?.toLowerCase() === 'link' ? 'Open Link' : 'Download'}
                    </DownloadButton>
                  </ResourceCardContent>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton onClick={() => handleOpen(resource)} color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(resource.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ResourceCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 1,
          }
        }}
      >
        <DialogTitle>
          {editMode ? 'Edit Resource' : 'Add New Resource'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Project</InputLabel>
              <Select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                label="Project"
                required
                disabled={editMode}
              >
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.project_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                label="Role"
                required
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.role_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <RadioGroup
                row
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  if (e.target.value === 'link') {
                    setSelectedFile(null);
                  }
                }}
              >
                <FormControlLabel 
                  value="link" 
                  control={<Radio />} 
                  label="Link" 
                />
                <FormControlLabel 
                  value="file" 
                  control={<Radio />} 
                  label="Document Upload" 
                />
              </RadioGroup>
            </FormControl>

            <TextField
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              value={formData.title}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />

            {resourceType === 'link' ? (
              <TextField
                margin="dense"
                name="file_path"
                label="Resource URL"
                type="url"
                fullWidth
                value={formData.file_path}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
                placeholder="https://example.com"
              />
            ) : (
              <Box sx={{ mb: 2 }}>
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 1 }}
                >
                  Upload Document
                  <VisuallyHiddenInput 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt"
                    required={resourceType === 'file' && !selectedFile}
                  />
                </Button>
                {selectedFile && (
                  <Typography variant="body2" color="textSecondary">
                    Selected file: {selectedFile.name}
                  </Typography>
                )}
                {resourceType === 'file' && !selectedFile && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    Please select a file
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button 
              onClick={handleClose}
              sx={{ 
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={resourceType === 'file' && !selectedFile}
              sx={{ 
                borderRadius: 1,
                textTransform: 'none',
              }}
            >
              {editMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManagerResources; 