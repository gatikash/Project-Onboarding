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
} from '@mui/icons-material';

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
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const ResourceIcon = styled(Box)(({ theme, color }) => ({
  width: 48,
  height: 48,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: `${color}20`,
  color: color,
  marginBottom: theme.spacing(2),
}));

function Resources({ projectId, isManager }) {
  const [resources, setResources] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    url: '',
    file: null,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (projectId) {
      fetchResources();
    }
  }, [projectId]);

  const fetchResources = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/resources/${projectId}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources');
    }
  };

  const handleOpen = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        title: resource.title,
        type: resource.type,
        url: resource.url,
        file: null,
      });
    } else {
      setEditingResource(null);
      setFormData({
        title: '',
        type: '',
        url: '',
        file: null,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingResource(null);
    setFormData({
      title: '',
      type: '',
      url: '',
      file: null,
    });
    setError('');
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFormData(prev => ({ ...prev, file }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      let filePath = '';
      let fileType = '';

      if (formData.file) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', formData.file);

        try {
          const uploadResponse = await axios.post(
            'http://localhost:3001/api/resources/upload',
            formDataToSend,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                const progress = (progressEvent.loaded / progressEvent.total) * 100;
                setUploadProgress(progress);
              },
            }
          );

          if (uploadResponse.data && uploadResponse.data.filename) {
            filePath = uploadResponse.data.filename;
            fileType = uploadResponse.data.mimetype;
          } else {
            throw new Error('File upload failed');
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          setError('Failed to upload file');
          setSnackbar({
            open: true,
            message: uploadError.response?.data?.error || 'Failed to upload file',
            severity: 'error',
          });
          return;
        }
      }

      const resourceData = {
        title: formData.title,
        type: formData.type,
        url: formData.type === 'link' ? formData.url : null,
        projectId: parseInt(projectId),
        filePath: formData.type !== 'link' ? filePath : null,
        fileType: formData.type !== 'link' ? fileType : null,
      };

      console.log('Sending resource data:', resourceData);

      let response;
      if (editingResource) {
        response = await axios.put(
          `http://localhost:3001/api/resources/${editingResource.id}`,
          resourceData
        );
      } else {
        response = await axios.post(
          'http://localhost:3001/api/resources',
          resourceData
        );
      }

      if (response.data) {
        setSnackbar({
          open: true,
          message: editingResource ? 'Resource updated successfully' : 'Resource added successfully',
          severity: 'success',
        });
        fetchResources();
        handleClose();
      } else {
        throw new Error('No response data received');
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Failed to save resource';
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await axios.delete(`http://localhost:3001/api/resources/${id}`);
        fetchResources();
        setSnackbar({
          open: true,
          message: 'Resource deleted successfully',
          severity: 'success',
        });
      } catch (error) {
        console.error('Error deleting resource:', error);
        setError('Failed to delete resource');
        setSnackbar({
          open: true,
          message: 'Failed to delete resource',
          severity: 'error',
        });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'document':
        return <DocumentIcon />;
      case 'video':
        return <VideoIcon />;
      case 'link':
        return <LinkIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getResourceColor = (type) => {
    switch (type) {
      case 'document':
        return '#2196f3';
      case 'video':
        return '#f44336';
      case 'link':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const handleDownload = (resource) => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank');
    } else {
      window.open(`http://localhost:3001/uploads/${resource.file_path}`, '_blank');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Project Resources
          </Typography>
          {isManager && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{ bgcolor: 'white', color: 'primary.main' }}
            >
              Add Resource
            </Button>
          )}
        </Box>
      </StyledPaper>

      {error && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      <Grid container spacing={3}>
        {resources.map((resource) => (
          <Grid item xs={12} sm={6} md={4} key={resource.id}>
            <ResourceCard>
              <CardContent>
                <ResourceIcon color={getResourceColor(resource.type)}>
                  {getResourceIcon(resource.type)}
                </ResourceIcon>
                <Typography variant="h6" gutterBottom>
                  {resource.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => handleDownload(resource)}
                  size="small"
                  sx={{ mt: 1 }}
                >
                  {resource.type === 'link' ? 'Open Link' : 'Download'}
                </Button>
              </CardContent>
              {isManager && (
                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(resource)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(resource.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </ResourceCard>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingResource ? 'Edit Resource' : 'Add New Resource'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                label="Type"
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="link">Link</MenuItem>
              </Select>
            </FormControl>
            {formData.type === 'link' ? (
              <TextField
                fullWidth
                label="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                margin="normal"
                required
              />
            ) : (
              <Box sx={{ mt: 2 }}>
                <input
                  accept={formData.type === 'document' ? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx' : '.mp4,.mov,.avi,.mkv,.webm'}
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    fullWidth
                  >
                    Upload {formData.type === 'document' ? 'Document' : 'Video'}
                  </Button>
                </label>
                {formData.file && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected file: {formData.file.name}
                  </Typography>
                )}
                {uploadProgress > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <CircularProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Uploading: {Math.round(uploadProgress)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !formData.title || !formData.type || 
              (formData.type === 'link' ? !formData.url : !formData.file)}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Resources; 