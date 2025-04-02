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
  Box,
  Chip,
  Alert,
  CircularProgress,
  styled,
} from '@mui/material';
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
  Folder as FolderIcon,
  Person as PersonIcon,
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
  transition: 'all 0.3s ease-in-out',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)',
  },
}));

const ResourceIcon = styled(Box)(({ theme, color }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: color,
  marginBottom: theme.spacing(2),
  '& > svg': {
    fontSize: 28,
    color: 'white',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  fontWeight: 500,
  padding: theme.spacing(1, 2),
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
}));

const RoleChip = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  color: 'white',
  '& .MuiChip-label': {
    fontWeight: 500,
  },
}));

const RoleTag = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  backgroundColor: 'rgba(33, 150, 243, 0.1)',
  color: '#1976d2',
  fontSize: '0.875rem',
  fontWeight: 500,
  marginBottom: theme.spacing(2),
  '& svg': {
    fontSize: 16,
    marginRight: theme.spacing(0.5),
  },
}));

function Resources({ projectId, selectedRole, isManager }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const userId = localStorage.getItem('userId');
  const roleId = localStorage.getItem('userRoleId');
  const isUserManager = roleId === '1';

  useEffect(() => {
    if (projectId) {
      fetchResources();
    }
  }, [projectId, selectedRole]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching resources for project:', projectId, 'role:', selectedRole);
      const response = await axios.get(`http://localhost:3001/api/resources/${projectId}`, {
        params: { 
          userId,
          roleId: isManager ? (selectedRole === 'all' ? null : selectedRole) : roleId
        }
      });

      if (response.data.success) {
        console.log('Resources fetched:', response.data.resources);
        setResources(response.data.resources);
      } else {
        throw new Error('Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError(error.response?.data?.error || 'Failed to fetch resources');
    } finally {
      setLoading(false);
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

  const getResourceColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return '#f44336';
      case 'link':
        return '#2196f3';
      case 'video':
        return '#f50057';
      case 'image':
        return '#00bcd4';
      default:
        return '#4caf50';
    }
  };

  const handleDownload = (resource) => {
    if (resource.file_type?.toLowerCase() === 'link') {
      window.open(resource.file_path, '_blank');
    } else {
      window.open(`http://localhost:3001${resource.file_path}`, '_blank');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <FolderIcon sx={{ fontSize: 32, mr: 2, color: '#2196f3' }} />
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Available Resources
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : !resources || resources.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No resources available for {selectedRole === 'all' ? 'any role' : 'the selected role'} in this project.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {resources.map((resource) => (
            <Grid item xs={12} sm={6} md={4} key={resource.id}>
              <ResourceCard>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <ResourceIcon color={getResourceColor(resource.file_type)}>
                      {getResourceIcon(resource.file_type)}
                    </ResourceIcon>
                    
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 600,
                      mb: 1
                    }}>
                      {resource.title}
                    </Typography>
                    
                    {resource.role_name && (
                      <RoleTag>
                        <PersonIcon />
                        {resource.role_name}
                      </RoleTag>
                    )}
                    
                    <Typography color="text.secondary" sx={{ 
                      mb: 2,
                      flex: 1
                    }}>
                      {resource.description}
                    </Typography>
                    
                    <StyledButton
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleDownload(resource)}
                      fullWidth
                      sx={{
                        borderColor: getResourceColor(resource.file_type),
                        color: getResourceColor(resource.file_type),
                        '&:hover': {
                          borderColor: getResourceColor(resource.file_type),
                          backgroundColor: `${getResourceColor(resource.file_type)}15`,
                        }
                      }}
                    >
                      {resource.file_type?.toLowerCase() === 'link' ? 'Open Link' : 'Download'}
                    </StyledButton>
                  </Box>
                </CardContent>
              </ResourceCard>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default Resources; 