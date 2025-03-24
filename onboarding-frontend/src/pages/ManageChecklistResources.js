import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Download as DownloadIcon,
  Image as ImageIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

const ResourceCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  borderRadius: theme.spacing(1),
  border: '1px solid',
  borderColor: theme.palette.grey[200],
  background: '#ffffff',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
}));

const ResourceCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  '&:last-child': {
    paddingBottom: theme.spacing(2),
  },
}));

const ResourceTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
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
  display: '-webkit-box',
  '-webkit-line-clamp': 2,
  '-webkit-box-orient': 'vertical',
  overflow: 'hidden',
}));

const ResourceIconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  backgroundColor: theme.palette.primary.light,
  '& > svg': {
    fontSize: 20,
    color: theme.palette.primary.main,
  },
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  borderRadius: theme.spacing(0.75),
  textTransform: 'none',
  padding: theme.spacing(1, 2),
  border: `1px solid ${theme.palette.grey[300]}`,
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    borderColor: theme.palette.primary.main,
  },
}));

const AddButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(0.75),
  textTransform: 'none',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.common.white,
  color: theme.palette.primary.main,
  border: `1px solid ${theme.palette.grey[300]}`,
  '&:hover': {
    backgroundColor: theme.palette.grey[50],
  },
}));

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

const ManageChecklistResources = ({ projectId: defaultProjectId }) => {
  const [resources, setResources] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceType, setResourceType] = useState('link');
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_id: defaultProjectId || '',
    role_id: '',
    file_path: '',
    file_type: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultProjectId) {
      fetchResources(defaultProjectId);
    }
    fetchProjects();
    fetchRoles();
  }, [defaultProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/projects');
      if (response.data.success) {
        setProjects(response.data.projects);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
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
    }
  };

  const fetchResources = async (pid) => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`http://localhost:3001/api/resources/${pid}`);
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
        project_id: defaultProjectId ? defaultProjectId.toString() : '',
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
    const { name, value } = e.target;
    console.log(`Field changed: ${name}, New value:`, value);
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      console.log('Updated form data:', updated);
      return updated;
    });
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
            fetchResources(formData.project_id);
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
            fetchResources(formData.project_id);
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

  const handleDelete = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const response = await axios.delete(`http://localhost:3001/api/resources/${resourceId}`);
        if (response.data.success) {
          setSuccess('Resource deleted successfully');
          fetchResources(formData.project_id);
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
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Resources
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="subtitle1" color="textSecondary">
            Manage and organize your project resources efficiently
          </Typography>
          <AddButton
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add New Resource
          </AddButton>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress size={32} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : !resources || resources.length === 0 ? (
        <Alert severity="info">
          No resources available for this project.
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
                  <DownloadButton
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(resource)}
                    fullWidth
                  >
                    {resource.file_type?.toLowerCase() === 'link' ? 'Open Link' : 'Download'}
                  </DownloadButton>
                </ResourceCardContent>
                <Box 
                  sx={{ 
                    p: 1, 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    gap: 1,
                    borderTop: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <IconButton 
                    onClick={() => handleOpen(resource)}
                    size="small"
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(resource.id)}
                    size="small"
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </ResourceCard>
            </Grid>
          ))}
        </Grid>
      )}

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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccess('')} 
          severity="success"
        >
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageChecklistResources; 