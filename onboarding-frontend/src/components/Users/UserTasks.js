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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';

// Styled Components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: '2rem',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  background: 'linear-gradient(to right, #ffffff, #f8f9fa)',
}));

const StyledTableContainer = styled(TableContainer)({
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  marginBottom: '1rem',
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 600,
  color: '#2c3e50',
  borderBottom: '2px solid #edf2f7',
  padding: '16px',
}));

const StyledTableRow = styled(TableRow)({
  '&:hover': {
    backgroundColor: '#f8fafc',
  },
  transition: 'background-color 0.2s ease',
});

const StyledChip = styled(Chip)(({ theme, status }) => ({
  borderRadius: '6px',
  fontWeight: 600,
  padding: '4px',
  backgroundColor: status === 'completed' ? '#dcfce7' : '#fff7ed',
  color: status === 'completed' ? '#166534' : '#9a3412',
  border: `1px solid ${status === 'completed' ? '#86efac' : '#fed7aa'}`,
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '6px',
  textTransform: 'none',
  fontWeight: 600,
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
}));

const PageTitle = styled(Typography)({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#1e293b',
  marginBottom: '0.5rem',
});

const priorityColors = {
  high: '#f44336',
  medium: '#ff9800',
  low: '#4caf50',
};

const categoryIcons = {
  documentation: '📄',
  setup: '⚙️',
  training: '📚',
  integration: '🤝',
  project: '📋',
};

function UserTasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    userId: '',
    projectId: '',
    taskDescription: '',
    dueDate: '',
    priority: 'medium',
    category: '',
    notes: '',
  });

  useEffect(() => {
    fetchTasks();
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3001/api/user-tasks');
      if (response.data.success) {
        setTasks(response.data.tasks);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      if (response.data.success) {
        setUsers(response.data.users.filter(user => user.role_name !== 'MANAGER'));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

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

  const handleOpenDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        userId: task.user_id,
        projectId: task.project_id,
        taskDescription: task.task_description,
        dueDate: task.due_date.split('T')[0],
        priority: task.priority,
        category: task.category,
        notes: task.notes || '',
      });
    } else {
      setSelectedTask(null);
      setFormData({
        userId: '',
        projectId: '',
        taskDescription: '',
        dueDate: '',
        priority: 'medium',
        category: '',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
    setFormData({
      userId: '',
      projectId: '',
      taskDescription: '',
      dueDate: '',
      priority: 'medium',
      category: '',
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (selectedTask) {
        // Update task
        const response = await axios.put(`http://localhost:3001/api/user-tasks/${selectedTask.id}`, {
          status: selectedTask.status,
          notes: formData.notes,
        });
        if (response.data.success) {
          setTasks(tasks.map(task => 
            task.id === selectedTask.id ? response.data.task : task
          ));
        }
      } else {
        // Create new task
        const response = await axios.post('http://localhost:3001/api/user-tasks', formData);
        if (response.data.success) {
          setTasks([response.data.task, ...tasks]);
        }
      }

      handleCloseDialog();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:3001/api/user-tasks/${taskId}`, {
        status: newStatus,
      });
      if (response.data.success) {
        setTasks(tasks.map(task => 
          task.id === taskId ? response.data.task : task
        ));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setLoading(true);
      const response = await axios.delete(`http://localhost:3001/api/user-tasks/${taskId}`);
      if (response.data.success) {
        setTasks(tasks.filter(task => task.id !== taskId));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <StyledPaper>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <PageTitle>
              User Tasks Management
            </PageTitle>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Manage and track user tasks efficiently
            </Typography>
          </Box>
        
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '8px',
              '& .MuiAlert-icon': {
                color: '#dc2626',
              },
            }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {loading && !tasks.length ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress sx={{ color: '#0ea5e9' }} />
          </Box>
        ) : (
          <>
            <StyledTableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>User</StyledTableCell>
                    <StyledTableCell>Project</StyledTableCell>
                    <StyledTableCell>Task</StyledTableCell>
                    <StyledTableCell>Status</StyledTableCell>
                    <StyledTableCell align="right">Actions</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(rowsPerPage > 0
                    ? tasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    : tasks
                  ).map((task) => (
                    <StyledTableRow key={task.id}>
                      <TableCell sx={{ color: '#4b5563' }}>{task.user_email}</TableCell>
                      <TableCell sx={{ color: '#4b5563' }}>{task.project_name}</TableCell>
                      <TableCell sx={{ color: '#4b5563' }}>{task.task_description}</TableCell>
                      <TableCell>
                        <StyledChip
                          label={task.status}
                          status={task.status}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {task.status === 'pending' ? (
                          <ActionButton
                            variant="contained"
                            color="success"
                            onClick={() => handleStatusChange(task.id, 'completed')}
                            size="small"
                            sx={{
                              backgroundColor: '#22c55e',
                              '&:hover': {
                                backgroundColor: '#16a34a',
                              },
                            }}
                          >
                            Mark as Complete
                          </ActionButton>
                        ) : (
                          <ActionButton
                            variant="outlined"
                            color="warning"
                            onClick={() => handleStatusChange(task.id, 'pending')}
                            size="small"
                            sx={{
                              borderColor: '#f97316',
                              color: '#f97316',
                              '&:hover': {
                                backgroundColor: '#fff7ed',
                                borderColor: '#ea580c',
                                color: '#ea580c',
                              },
                            }}
                          >
                            Mark as Pending
                          </ActionButton>
                        )}
                      </TableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </StyledTableContainer>
            <TablePagination
              component="div"
              count={tasks.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-select': {
                  borderRadius: '6px',
                },
                '.MuiTablePagination-selectIcon': {
                  color: '#6b7280',
                },
              }}
            />
          </>
        )}

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid #e2e8f0',
            fontWeight: 600,
            fontSize: '1.25rem',
            color: '#1e293b',
          }}>
            {selectedTask ? 'Edit Task' : 'Add New Task'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              {!selectedTask && (
                <>
                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>User</InputLabel>
                    <Select
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      label="User"
                    >
                      {users.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Project</InputLabel>
                    <Select
                      value={formData.projectId}
                      onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                      label="Project"
                    >
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.project_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Task Description"
                    value={formData.taskDescription}
                    onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                    margin="normal"
                    required
                    multiline
                    rows={2}
                  />

                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    margin="normal"
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      label="Priority"
                    >
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="low">Low</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal" required>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      label="Category"
                    >
                      <MenuItem value="documentation">Documentation</MenuItem>
                      <MenuItem value="setup">Setup</MenuItem>
                      <MenuItem value="training">Training</MenuItem>
                      <MenuItem value="integration">Integration</MenuItem>
                      <MenuItem value="project">Project</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0' }}>
            <Button 
              onClick={handleCloseDialog}
              sx={{ 
                color: '#64748b',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                },
              }}
            >
              Cancel
            </Button>
            <ActionButton
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: '#0ea5e9',
                '&:hover': {
                  backgroundColor: '#0284c7',
                },
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </ActionButton>
          </DialogActions>
        </Dialog>
      </StyledPaper>
    </Container>
  );
}

export default UserTasks; 