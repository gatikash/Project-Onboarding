import React, { useState, useEffect } from 'react';
import { Container, Typography } from '@mui/material';
import Resources from '../components/UserResources';

function ResourcesPage() {
  const [selectedProject, setSelectedProject] = useState(null);
  const roleId = localStorage.getItem('userRoleId');
  const isManager = roleId === '1';

  useEffect(() => {
    // Get the user's first project as default
    const fetchDefaultProject = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:3001/api/users/${userId}/projects`);
        const data = await response.json();
        if (data.success && data.projects.length > 0) {
          setSelectedProject(data.projects[0].id);
        }
      } catch (error) {
        console.error('Error fetching default project:', error);
      }
    };

    fetchDefaultProject();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Resources
      </Typography>
      {selectedProject && (
        <Resources
          projectId={selectedProject}
          selectedRole={isManager ? 'all' : roleId}
          isManager={isManager}
        />
      )}
    </Container>
  );
}

export default ResourcesPage; 