import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  Select,
  MenuItem,
  styled,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Done as DoneIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import axios from 'axios';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  background: 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)',
  color: 'white',
  borderRadius: theme.spacing(2),
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
  '&:first-of-type': {
    paddingLeft: theme.spacing(3),
  },
  '&:last-of-type': {
    paddingRight: theme.spacing(3),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: theme.spacing(1),
  minWidth: '250px',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.23)',
    borderWidth: '1px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(0, 0, 0, 0.87)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: '2px',
  },
  '& .MuiSelect-select': {
    padding: theme.spacing(1.5, 2),
    color: 'rgba(0, 0, 0, 0.87)',
    fontSize: '1rem',
  },
  '& .MuiSelect-icon': {
    color: 'rgba(0, 0, 0, 0.54)',
    right: theme.spacing(1),
  },
}));

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  fontSize: '1rem',
  color: 'rgba(0, 0, 0, 0.87)',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const StatusChip = styled(Box)(({ theme, status }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(1),
  backgroundColor: status === 'completed' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
  color: status === 'completed' ? '#2e7d32' : '#f57c00',
  '& svg': {
    marginRight: theme.spacing(0.5),
    fontSize: 16,
  },
}));

function UserChecklist() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTasks();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/users/${userId}/projects`);
      if (response.data.success) {
        setProjects(response.data.projects);
        if (response.data.projects.length > 0) {
          setSelectedProject(response.data.projects[0].id);
        }
      }
    } catch (err) {
      setError('Failed to fetch projects');
      console.error('Error fetching projects:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/user-checklists/${userId}/${selectedProject}`);
      if (response.data.success) {
        setTasks(response.data.tasks);
      }
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const response = await axios.put(`http://localhost:3001/api/user-checklists/${taskId}`, {
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      });

      if (response.data.success) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        ));
      }
    } catch (err) {
      setError('Failed to update task status');
      console.error('Error updating task status:', err);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper elevation={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AssignmentIcon sx={{ fontSize: 32, mr: 2 }} />
          <Typography variant="h4" component="h1">
            My Tasks
          </Typography>
        </Box>

        <FormControl sx={{ mb: 3 }}>
          <StyledSelect
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            displayEmpty
            variant="outlined"
            size="medium"
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 300,
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                  borderRadius: 1,
                }
              }
            }}
          >
            {projects.map((project) => (
              <StyledMenuItem key={project.id} value={project.id}>
                {project.project_name}
              </StyledMenuItem>
            ))}
          </StyledSelect>
        </FormControl>

        <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Task</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <StyledTableRow key={task.id}>
                  <StyledTableCell>{task.task_description}</StyledTableCell>
                  <StyledTableCell>
                    <StatusChip status={task.status}>
                      {task.status === 'completed' ? <CheckCircleIcon /> : <CancelIcon />}
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </StatusChip>
                  </StyledTableCell>
                  <StyledTableCell align="center">
                    <IconButton
                      color={task.status === 'completed' ? 'warning' : 'success'}
                      onClick={() => handleStatusChange(task.id, task.status)}
                      size="small"
                      title={task.status === 'completed' ? 'Mark as Pending' : 'Mark as Complete'}
                      sx={{
                        '&:hover': {
                          backgroundColor: task.status === 'completed' 
                            ? 'rgba(255, 152, 0, 0.1)' 
                            : 'rgba(76, 175, 80, 0.1)',
                        }
                      }}
                    >
                      {task.status === 'completed' ? <CancelIcon /> : <DoneIcon />}
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </StyledPaper>
    </Container>
  );
}

export default UserChecklist; 