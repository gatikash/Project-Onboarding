const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3001;

// Database configuration
const config = {
  user: 'sa',
  password: 'London@1234',
  server: 'DESKTOP-VTDJ6NS',
  database: 'onboarding_db',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

// Create connection pool
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created uploads directory:', uploadDir);
      } catch (err) {
        console.error('Error creating uploads directory:', err);
        cb(err, null);
        return;
      }
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Keep original filename but make it unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} files are allowed.`));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('file');

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors());
app.use(express.json());

// Database connection error handling
pool.on('error', err => {
  console.error('Database error:', err);
});

// Create roles table if it doesn't exist
poolConnect.then(async () => {
  try {
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
      BEGIN
        CREATE TABLE roles (
          id INT IDENTITY(1,1) PRIMARY KEY,
          role_name VARCHAR(50) NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        );

        -- Insert default roles
        INSERT INTO roles (role_name) VALUES 
          ('MANAGER'),
          ('EMPLOYEE');
      END
    `);
    console.log('Roles table initialized');
  } catch (err) {
    console.error('Error initializing roles table:', err);
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    await poolConnect;
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // Query to get user with role information
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .query(`
        SELECT u.id, u.email, u.role_id, r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email = @email AND u.password = @password
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      console.log('Login successful for user:', user.email, 'with role:', user.role_name);
      res.json({
        success: true,
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name
      });
    } else {
      console.log('Invalid credentials for email:', email);
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get checklist items based on role
app.get('/api/checklist', async (req, res) => {
  try {
    await poolConnect;
    const { projectId, roleId } = req.query;

    if (!projectId || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and Role ID are required'
      });
    }

    console.log('Fetching checklist for project:', projectId, 'and role:', roleId);
    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .input('roleId', sql.Int, roleId)
      .query(`
        SELECT t.*, p.project_name, r.role_name
        FROM Tasks t
        JOIN projects p ON t.project_id = p.id
        JOIN roles r ON t.role_id = r.id
        WHERE t.project_id = @projectId 
        AND (t.role_id = @roleId OR @roleId = 1)
        ORDER BY t.created_at DESC
      `);

    console.log('Tasks found:', result.recordset.length);
    res.json({
      success: true,
      tasks: result.recordset
    });
  } catch (err) {
    console.error('Error fetching checklist:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch checklist',
      details: err.message
    });
  }
});

// Update task status
app.put('/api/checklist/:id', async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.VarChar, status)
      .query(`
        UPDATE Tasks
        SET status = @status
        WHERE id = @id
      `);

    if (result.rowsAffected[0] > 0) {
      res.json({
        success: true,
        message: 'Task status updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get projects
app.get('/api/projects', async (req, res) => {
  try {
    await poolConnect;
    console.log('Fetching projects...');
    const result = await pool.request().query('SELECT * FROM projects ORDER BY created_at DESC');
    console.log('Projects fetched:', result.recordset);
    res.json({
      success: true,
      projects: result.recordset
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch projects' 
    });
  }
});

// Get manager tasks (all tasks for a project)
app.get('/api/checklist/manager', async (req, res) => {
  try {
    await poolConnect;
    const { projectId, roleId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    console.log('Fetching manager tasks for project:', projectId, 'role filter:', roleId);
    let query = `
      SELECT t.*, p.project_name, r.role_name
      FROM Tasks t
      JOIN projects p ON t.project_id = p.id
      LEFT JOIN roles r ON t.role_id = r.id
      WHERE t.project_id = @projectId
    `;

    // Add role filter if roleId is provided
    if (roleId && roleId !== 'all') {
      query += ` AND t.role_id = @roleId`;
    }

    query += ` ORDER BY t.created_at DESC`;

    const request = pool.request()
      .input('projectId', sql.Int, projectId);

    if (roleId && roleId !== 'all') {
      request.input('roleId', sql.Int, roleId);
    }

    const result = await request.query(query);

    console.log('Tasks found:', result.recordset.length);
    res.json({
      success: true,
      tasks: result.recordset
    });
  } catch (err) {
    console.error('Error fetching manager tasks:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      details: err.message
    });
  }
});

// Get roles
app.get('/api/roles', async (req, res) => {
  try {
    await poolConnect;
    console.log('Fetching roles from database...');
    
    const result = await pool.request().query(`
      SELECT * FROM roles
      ORDER BY role_name ASC
    `);

    console.log('Roles fetched:', result.recordset);
    
    if (!result.recordset || result.recordset.length === 0) {
      console.log('No roles found in database');
      return res.status(404).json({
        success: false,
        error: 'No roles found'
      });
    }

    res.json({
      success: true,
      roles: result.recordset
    });
  } catch (err) {
    console.error('Error fetching roles:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
});

// Add new task
app.post('/api/checklist', async (req, res) => {
  try {
    await poolConnect;
    const { task, projectId, roleId, status } = req.body;

    const result = await pool.request()
      .input('task', sql.VarChar, task)
      .input('projectId', sql.Int, projectId)
      .input('roleId', sql.Int, roleId)
      .input('status', sql.VarChar, status)
      .query(`
        INSERT INTO Tasks (task, project_id, role_id, status, created_at)
        VALUES (@task, @projectId, @roleId, @status, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const newTask = {
      id: result.recordset[0].id,
      task,
      project_id: projectId,
      role_id: roleId,
      status,
      created_at: new Date()
    };

    res.json(newTask);
  } catch (err) {
    console.error('Error adding task:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update resources table structure
poolConnect.then(async () => {
  try {
    await pool.request().query(`
      -- Add role_id column if it doesn't exist
      IF NOT EXISTS (
        SELECT * FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'resources') 
        AND name = 'role_id'
      )
      BEGIN
        ALTER TABLE resources
        ADD role_id INT;

        -- Add foreign key constraint
        ALTER TABLE resources
        ADD CONSTRAINT FK_resources_roles
        FOREIGN KEY (role_id) REFERENCES roles(id);

        -- Update existing resources to have role_id = 1 (MANAGER)
        UPDATE resources
        SET role_id = 1
        WHERE role_id IS NULL;
      END
    `);
    console.log('Resources table structure updated');
  } catch (err) {
    console.error('Error updating resources table:', err);
  }
});

// Get resources for a project and role
app.get('/api/resources/:projectId', async (req, res) => {
  try {
    await poolConnect;
    const { projectId } = req.params;
    const { roleId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      });
    }

    console.log('Fetching resources for project:', projectId, 'role:', roleId);
    let query = `
      SELECT r.*, p.project_name, ro.role_name
      FROM resources r
      JOIN projects p ON r.project_id = p.id
      LEFT JOIN roles ro ON r.role_id = ro.id
      WHERE r.project_id = @projectId
    `;

    // If roleId is provided and not manager (1), filter by role
    // For manager, show all resources
    if (roleId && roleId !== '1') {
      query += ` AND (r.role_id = @roleId OR r.role_id IS NULL)`;
    }

    query += ` ORDER BY r.created_at DESC`;

    const request = pool.request()
      .input('projectId', sql.Int, projectId);

    if (roleId && roleId !== '1') {
      request.input('roleId', sql.Int, roleId);
    }

    const result = await request.query(query);

    res.json({
      success: true,
      resources: result.recordset
    });
  } catch (err) {
    console.error('Error fetching resources:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message
    });
  }
});

// Add new resource with file upload
app.post('/api/resources', async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      console.error('Multer error:', err);
      return res.status(400).json({
        success: false,
        error: `File upload error: ${err.message}`
      });
    } else if (err) {
      // An unknown error occurred
      console.error('Unknown upload error:', err);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      await poolConnect;
      const { title, description, projectId, roleId } = req.body;
      let filePath = null;
      let fileType = 'link';

      if (req.file) {
        console.log('File uploaded:', req.file);
        filePath = req.file.filename;
        fileType = 'file';
      } else if (req.body.file_path) {
        filePath = req.body.file_path;
        fileType = 'link';
      }

      if (!title || !projectId || !roleId) {
        return res.status(400).json({
          success: false,
          error: 'Title, project ID, and role ID are required'
        });
      }

      const result = await pool.request()
        .input('title', sql.VarChar, title)
        .input('description', sql.VarChar, description || '')
        .input('file_path', sql.VarChar, filePath)
        .input('file_type', sql.VarChar, fileType)
        .input('projectId', sql.Int, parseInt(projectId))
        .input('roleId', sql.Int, parseInt(roleId))
        .query(`
          INSERT INTO resources (title, description, file_path, file_type, project_id, role_id, created_at)
          VALUES (@title, @description, @file_path, @file_type, @projectId, @roleId, GETDATE());
          SELECT SCOPE_IDENTITY() AS id;
        `);

      const newResource = {
        id: result.recordset[0].id,
        title,
        description,
        file_path: filePath,
        file_type: fileType,
        project_id: parseInt(projectId),
        role_id: parseInt(roleId),
        created_at: new Date()
      };

      console.log('Resource created:', newResource);

      res.json({
        success: true,
        resource: newResource
      });
    } catch (err) {
      console.error('Error adding resource:', err);
      if (req.file) {
        // Clean up uploaded file if there was an error
        try {
          fs.unlinkSync(path.join(__dirname, 'uploads', req.file.filename));
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
      res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
      });
    }
  });
});

// Create a new project
app.post('/api/projects', async (req, res) => {
  try {
    await poolConnect;
    const { project_name } = req.body;
    
    if (!project_name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await pool.request()
      .input('project_name', sql.VarChar, project_name)
      .query(`
        INSERT INTO projects (project_name, created_at)
        VALUES (@project_name, GETDATE());
        SELECT SCOPE_IDENTITY() AS id;
      `);

    const newProjectId = result.recordset[0].id;
    
    // Fetch the newly created project
    const newProject = await pool.request()
      .input('id', sql.Int, newProjectId)
      .query('SELECT * FROM projects WHERE id = @id');

    res.status(201).json(newProject.recordset[0]);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update a project
app.put('/api/projects/:id', async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;
    const { project_name } = req.body;
    
    if (!project_name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('project_name', sql.VarChar, project_name)
      .query('UPDATE projects SET project_name = @project_name WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM projects WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get user progress status for a project
app.get('/api/status/:projectId', async (req, res) => {
  try {
    await poolConnect;
    const { projectId } = req.params;

    // Get all tasks for the project with their status and assignments
    const result = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        -- Get all users with their roles (excluding managers)
        WITH ProjectUsers AS (
          SELECT DISTINCT 
            u.id,
            u.email,
            r.role_name,
            r.id as role_id
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE r.role_name != 'MANAGER'
        )
        -- Get task status for each user
        SELECT 
          u.id as user_id,
          u.email,
          u.role_name,
          t.id as task_id,
          t.task as task_description,
          t.status,
          CASE 
            WHEN t.assigned_to = u.id THEN 'Assigned directly'
            ELSE 'Via role: ' + u.role_name
          END as assignment_type
        FROM ProjectUsers u
        LEFT JOIN Tasks t ON (
          t.project_id = @projectId 
          AND (t.role_id = u.role_id OR t.assigned_to = u.id)
        )
        ORDER BY u.email, t.created_at DESC
      `);

    // Process the results to group by user
    const userMap = new Map();
    result.recordset.forEach(record => {
      if (!record.task_id) return; // Skip if no task

      if (!userMap.has(record.user_id)) {
        userMap.set(record.user_id, {
          user_id: record.user_id,
          email: record.email,
          role_name: record.role_name,
          total_tasks: 0,
          completed_tasks: 0,
          pending_tasks: 0,
          pending_tasks_list: []
        });
      }

      const user = userMap.get(record.user_id);
      user.total_tasks++;
      
      if (record.status === 'completed') {
        user.completed_tasks++;
      } else {
        user.pending_tasks++;
        user.pending_tasks_list.push({
          id: record.task_id,
          task_description: record.task_description,
          assignment_type: record.assignment_type
        });
      }
    });

    // Convert user progress map to array
    const userProgress = Array.from(userMap.values());

    // Get overall project status
    const projectResult = await pool.request()
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          t.id,
          t.task,
          t.status,
          r.role_name,
          u.email as assigned_to_email
        FROM Tasks t
        LEFT JOIN roles r ON t.role_id = r.id
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.project_id = @projectId
        ORDER BY t.created_at DESC
      `);

    const tasks = projectResult.recordset;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    res.json({
      success: true,
      projectStatus: {
        totalTasks,
        completedTasks,
        progress,
        tasks
      },
      userProgress
    });
  } catch (err) {
    console.error('Error fetching status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status',
      details: err.message
    });
  }
});

// Get all users with their roles and project assignments
app.get('/api/users', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        u.id,
        u.email,
        u.role_id,
        r.role_name,
        STRING_AGG(p.project_name, ', ') as assigned_projects,
        STRING_AGG(CAST(p.id as VARCHAR), ',') as project_ids,
        u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN UserProjects up ON u.id = up.user_id
      LEFT JOIN projects p ON up.project_id = p.id
      GROUP BY u.id, u.email, u.role_id, r.role_name, u.created_at
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      users: result.recordset
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: err.message
    });
  }
});

// Create user endpoint
app.post('/api/users', async (req, res) => {
  const transaction = new sql.Transaction(pool);
  try {
    await poolConnect;
    await transaction.begin();
    const { email, password, roleId, projectIds } = req.body;

    console.log('Received user creation request:', {
      email,
      roleId,
      projectIds,
      hasPassword: !!password
    });

    // Validate required fields
    if (!email || !password || !roleId || !projectIds || !projectIds.length) {
      console.log('Validation failed:', {
        hasEmail: !!email,
        hasPassword: !!password,
        hasRoleId: !!roleId,
        hasProjectIds: !!projectIds,
        projectIdsLength: projectIds?.length
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Insert user
    console.log('Inserting user into database...');
    const userResult = await transaction.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .input('roleId', sql.Int, roleId)
      .query(`
        INSERT INTO users (email, password, role_id)
        OUTPUT INSERTED.id, INSERTED.email, INSERTED.role_id
        VALUES (@email, @password, @roleId)
      `);

    const userId = userResult.recordset[0].id;
    console.log('User created with ID:', userId);

    // Insert project assignments
    console.log('Assigning projects:', projectIds);
    for (const projectId of projectIds) {
      await transaction.request()
        .input('userId', sql.Int, userId)
        .input('projectId', sql.Int, projectId)
        .query(`
          INSERT INTO UserProjects (user_id, project_id)
          VALUES (@userId, @projectId)
        `);
    }

    await transaction.commit();
    console.log('Transaction committed successfully');

    // Fetch the created user with all details
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          u.id,
          u.email,
          u.role_id,
          r.role_name,
          STRING_AGG(p.project_name, ', ') as assigned_projects,
          STRING_AGG(CAST(p.id as VARCHAR), ',') as project_ids,
          u.created_at
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN UserProjects up ON u.id = up.user_id
        LEFT JOIN projects p ON up.project_id = p.id
        WHERE u.id = @userId
        GROUP BY u.id, u.email, u.role_id, r.role_name, u.created_at
      `);

    console.log('Sending response with user details:', result.recordset[0]);
    res.json({
      success: true,
      message: 'User created successfully',
      user: result.recordset[0]
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Error creating user:', {
      message: err.message,
      stack: err.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: err.message
    });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;
    const { email, password, roleId, projectIds } = req.body;

    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Update user details
      const updateQuery = password 
        ? `UPDATE users SET email = @email, password = @password, role_id = @roleId WHERE id = @id`
        : `UPDATE users SET email = @email, role_id = @roleId WHERE id = @id`;

      await transaction.request()
        .input('id', sql.Int, id)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, password)
        .input('roleId', sql.Int, roleId)
        .query(updateQuery);

      // Get current project assignments
      const currentProjects = await transaction.request()
        .input('userId', sql.Int, id)
        .query('SELECT project_id FROM UserProjects WHERE user_id = @userId');
      
      const currentProjectIds = new Set(currentProjects.recordset.map(p => p.project_id));
      const newProjectIds = new Set(projectIds);

      // Remove existing project assignments
      await transaction.request()
        .input('userId', sql.Int, id)
        .query('DELETE FROM UserProjects WHERE user_id = @userId');

      // Add new project assignments and copy tasks for new projects
      if (projectIds && projectIds.length > 0) {
        for (const projectId of projectIds) {
          // Insert project assignment
          await transaction.request()
            .input('userId', sql.Int, id)
            .input('projectId', sql.Int, projectId)
            .query(`
              INSERT INTO UserProjects (user_id, project_id)
              VALUES (@userId, @projectId)
            `);

          // Only copy tasks for newly assigned projects
          if (!currentProjectIds.has(projectId)) {
            // Copy tasks from Manager's checklist that match the user's role
            await transaction.request()
              .input('userId', sql.Int, id)
              .input('projectId', sql.Int, projectId)
              .input('roleId', sql.Int, roleId)
              .input('managerId', sql.Int, 1) // Default manager ID
              .query(`
                -- Get tasks from the Tasks table that match the user's role and project
                INSERT INTO UserChecklists (
                  user_id,
                  project_id,
                  task_description,
                  status,
                  due_date,
                  priority,
                  category,
                  notes,
                  assigned_by
                )
                SELECT 
                  @userId,
                  @projectId,
                  t.task,
                  'pending',
                  DATEADD(day, 7, GETDATE()),
                  'medium',
                  'project',
                  @managerId,
                  GETDATE()
                FROM Tasks t
                WHERE t.project_id = @projectId 
                AND t.role_id = @roleId;
              `);
          }
        }
      }

      await transaction.commit();

      // Fetch updated user data
      const updatedUser = await pool.request()
        .input('userId', sql.Int, id)
        .query(`
          SELECT 
            u.id,
            u.email,
            u.role_id,
            r.role_name,
            STRING_AGG(p.project_name, ', ') as assigned_projects,
            STRING_AGG(CAST(p.id as VARCHAR), ',') as project_ids,
            u.created_at
          FROM users u
          JOIN roles r ON u.role_id = r.id
          LEFT JOIN UserProjects up ON u.id = up.user_id
          LEFT JOIN projects p ON up.project_id = p.id
          WHERE u.id = @userId
          GROUP BY u.id, u.email, u.role_id, r.role_name, u.created_at
        `);

      res.json({
        success: true,
        user: updatedUser.recordset[0]
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      details: err.message
    });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    await poolConnect;
    const { id } = req.params;

    // Start a transaction
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Delete user's project assignments
      await transaction.request()
        .input('userId', sql.Int, id)
        .query('DELETE FROM UserProjects WHERE user_id = @userId');

      // Delete user's tasks
      await transaction.request()
        .input('userId', sql.Int, id)
        .query('DELETE FROM Tasks WHERE assigned_to = @userId');

      // Delete the user
      await transaction.request()
        .input('userId', sql.Int, id)
        .query('DELETE FROM users WHERE id = @userId');

      await transaction.commit();

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      details: err.message
    });
  }
});

// Get all user tasks for a manager
app.get('/api/user-tasks', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        uc.id,
        uc.user_id,
        u.email as user_email,
        uc.project_id,
        p.project_name,
        uc.task_description,
        uc.status,
        uc.due_date,
        uc.priority,
        uc.category,
        uc.created_at,
        uc.completed_at,
        uc.notes,
        r.role_name as user_role
      FROM UserChecklists uc
      JOIN users u ON uc.user_id = u.id
      JOIN projects p ON uc.project_id = p.id
      JOIN roles r ON u.role_id = r.id
      WHERE u.role_id != 1  -- Exclude managers
      ORDER BY uc.due_date ASC, uc.priority DESC
    `);

    res.json({
      success: true,
      tasks: result.recordset
    });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tasks',
      details: err.message
    });
  }
});

// Get tasks for a specific user
app.get('/api/user-tasks/:userId', async (req, res) => {
  try {
    await poolConnect;
    const { userId } = req.params;
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          uc.id,
          uc.project_id,
          p.project_name,
          uc.task_description,
          uc.status,
          uc.due_date,
          uc.priority,
          uc.category,
          uc.created_at,
          uc.completed_at,
          uc.notes
        FROM UserChecklists uc
        JOIN projects p ON uc.project_id = p.id
        WHERE uc.user_id = @userId
        ORDER BY uc.due_date ASC, uc.priority DESC
      `);

    res.json({
      success: true,
      tasks: result.recordset
    });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tasks',
      details: err.message
    });
  }
});

// Add new task for a user
app.post('/api/user-tasks', async (req, res) => {
  try {
    await poolConnect;
    const { userId, projectId, taskDescription, dueDate, priority, category, notes } = req.body;
    const managerId = req.body.managerId || 1; // Default to first manager if not specified

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('projectId', sql.Int, projectId)
      .input('taskDescription', sql.NVarChar, taskDescription)
      .input('dueDate', sql.Date, dueDate)
      .input('priority', sql.VarChar, priority)
      .input('category', sql.VarChar, category)
      .input('notes', sql.NVarChar, notes)
      .input('assignedBy', sql.Int, managerId)
      .query(`
        INSERT INTO UserChecklists (
          user_id,
          project_id,
          task_description,
          status,
          due_date,
          priority,
          category,
          notes,
          assigned_by
        )
        VALUES (
          @userId,
          @projectId,
          @taskDescription,
          'pending',
          @dueDate,
          @priority,
          @category,
          @notes,
          @assignedBy
        );
        
        SELECT SCOPE_IDENTITY() as id;
      `);

    const taskId = result.recordset[0].id;

    // Fetch the newly created task
    const newTask = await pool.request()
      .input('taskId', sql.Int, taskId)
      .query(`
        SELECT 
          uc.id,
          uc.user_id,
          u.email as user_email,
          uc.project_id,
          p.project_name,
          uc.task_description,
          uc.status,
          uc.due_date,
          uc.priority,
          uc.category,
          uc.created_at,
          uc.completed_at,
          uc.notes
        FROM UserChecklists uc
        JOIN users u ON uc.user_id = u.id
        JOIN projects p ON uc.project_id = p.id
        WHERE uc.id = @taskId
      `);

    res.json({
      success: true,
      task: newTask.recordset[0]
    });
  } catch (err) {
    console.error('Error creating user task:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create user task',
      details: err.message
    });
  }
});

// Update task status
app.put('/api/user-tasks/:taskId', async (req, res) => {
  try {
    await poolConnect;
    const { taskId } = req.params;
    const { status, notes } = req.body;

    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('status', sql.VarChar, status)
      .input('notes', sql.NVarChar, notes)
      .input('completedAt', sql.DateTime, status === 'completed' ? new Date() : null)
      .query(`
        UPDATE UserChecklists
        SET 
          status = @status,
          notes = @notes,
          completed_at = @completedAt
        WHERE id = @taskId;

        SELECT 
          uc.id,
          uc.user_id,
          u.email as user_email,
          uc.project_id,
          p.project_name,
          uc.task_description,
          uc.status,
          uc.due_date,
          uc.priority,
          uc.category,
          uc.created_at,
          uc.completed_at,
          uc.notes
        FROM UserChecklists uc
        JOIN users u ON uc.user_id = u.id
        JOIN projects p ON uc.project_id = p.id
        WHERE uc.id = @taskId
      `);

    res.json({
      success: true,
      task: result.recordset[0]
    });
  } catch (err) {
    console.error('Error updating user task:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update user task',
      details: err.message
    });
  }
});

// Delete task
app.delete('/api/user-tasks/:taskId', async (req, res) => {
  try {
    await poolConnect;
    const { taskId } = req.params;

    await pool.request()
      .input('taskId', sql.Int, taskId)
      .query('DELETE FROM UserChecklists WHERE id = @taskId');

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting user task:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user task',
      details: err.message
    });
  }
});

// Get user's projects
app.get('/api/users/:userId/projects', async (req, res) => {
  try {
    await poolConnect;
    const { userId } = req.params;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT DISTINCT 
          p.id,
          p.project_name
        FROM projects p
        JOIN UserProjects up ON p.id = up.project_id
        WHERE up.user_id = @userId
      `);

    res.json({
      success: true,
      projects: result.recordset
    });
  } catch (err) {
    console.error('Error fetching user projects:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user projects'
    });
  }
});

// Get user's tasks for a specific project
app.get('/api/user-checklists/:userId/:projectId', async (req, res) => {
  try {
    await poolConnect;
    const { userId, projectId } = req.params;

    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('projectId', sql.Int, projectId)
      .query(`
        SELECT 
          uc.id,
          uc.task_description,
          uc.status,
          uc.due_date,
          uc.priority,
          uc.category,
          uc.notes,
          uc.completed_at
        FROM UserChecklists uc
        WHERE uc.user_id = @userId 
        AND uc.project_id = @projectId
        ORDER BY 
          CASE uc.status 
            WHEN 'pending' THEN 0 
            ELSE 1 
          END,
          uc.due_date ASC
      `);

    res.json({
      success: true,
      tasks: result.recordset
    });
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tasks'
    });
  }
});

// Update user task status
app.put('/api/user-checklists/:taskId', async (req, res) => {
  try {
    await poolConnect;
    const { taskId } = req.params;
    const { status, completed_at } = req.body;

    const result = await pool.request()
      .input('taskId', sql.Int, taskId)
      .input('status', sql.VarChar, status)
      .input('completedAt', sql.DateTime, completed_at)
      .query(`
        UPDATE UserChecklists
        SET 
          status = @status,
          completed_at = CASE 
            WHEN @status = 'completed' THEN @completedAt
            ELSE NULL
          END
        WHERE id = @taskId;

        SELECT 
          id,
          task_description,
          status,
          due_date,
          priority,
          category,
          notes,
          completed_at
        FROM UserChecklists
        WHERE id = @taskId;
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task: result.recordset[0]
    });
  } catch (err) {
    console.error('Error updating task status:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update task status'
    });
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    await poolConnect;
    
    // Create roles table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
      BEGIN
        CREATE TABLE roles (
          id INT IDENTITY(1,1) PRIMARY KEY,
          role_name VARCHAR(50) NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        );

        -- Insert default roles
        INSERT INTO roles (role_name) VALUES 
          ('MANAGER'),
          ('EMPLOYEE');
      END
    `);

    // Create Projects table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'projects')
      BEGIN
        CREATE TABLE projects (
          id INT PRIMARY KEY IDENTITY(1,1),
          project_name VARCHAR(255) NOT NULL,
          created_at DATETIME DEFAULT GETDATE()
        );

        -- Insert some default projects
        INSERT INTO projects (project_name) VALUES 
          ('Onboarding Project'),
          ('Training Project');
      END
    `);

    // Create Users table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        CREATE TABLE users (
          id INT PRIMARY KEY IDENTITY(1,1),
          email VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          role_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (role_id) REFERENCES roles(id)
        );

        -- Insert default users
        IF NOT EXISTS (SELECT * FROM users)
        BEGIN
          DECLARE @managerRoleId INT, @employeeRoleId INT;
          
          SELECT @managerRoleId = id FROM roles WHERE role_name = 'MANAGER';
          SELECT @employeeRoleId = id FROM roles WHERE role_name = 'EMPLOYEE';

          -- Add a manager
          INSERT INTO users (email, password, role_id)
          VALUES ('manager@example.com', 'password123', @managerRoleId);

          -- Add some employees
          INSERT INTO users (email, password, role_id)
          VALUES 
            ('employee1@example.com', 'password123', @employeeRoleId),
            ('employee2@example.com', 'password123', @employeeRoleId);
        END
      END
    `);

    // Create UserProjects table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserProjects')
      BEGIN
        CREATE TABLE UserProjects (
          id INT PRIMARY KEY IDENTITY(1,1),
          user_id INT NOT NULL,
          project_id INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (project_id) REFERENCES projects(id)
        );
      END
    `);

    console.log('UserProjects table initialized');

    // Create Tasks table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tasks')
      BEGIN
        CREATE TABLE Tasks (
          id INT PRIMARY KEY IDENTITY(1,1),
          task VARCHAR(500) NOT NULL,
          project_id INT NOT NULL,
          role_id INT NOT NULL,
          assigned_to INT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (project_id) REFERENCES projects(id),
          FOREIGN KEY (role_id) REFERENCES roles(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        );
      END
    `);

    // Create UserChecklists table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserChecklists')
      BEGIN
        CREATE TABLE UserChecklists (
          id INT PRIMARY KEY IDENTITY(1,1),
          user_id INT NOT NULL,
          project_id INT NOT NULL,
          task_description NVARCHAR(500) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          due_date DATE NOT NULL,
          priority VARCHAR(20) NOT NULL,
          category VARCHAR(50) NOT NULL,
          notes NVARCHAR(MAX),
          assigned_by INT NOT NULL,
          created_at DATETIME DEFAULT GETDATE(),
          completed_at DATETIME,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (project_id) REFERENCES projects(id),
          FOREIGN KEY (assigned_by) REFERENCES users(id)
        );
      END
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Call initializeDatabase when the server starts
initializeDatabase().catch(console.error);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});