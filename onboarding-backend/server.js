const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Use auth routes
app.use('/api/auth', authRoutes);

const config = {
  server: 'DESKTOP-VTDJ6NS', // Your SQL Server instance name
  database: 'onboarding_db', // The name of your database
  user: 'sa', // SQL Server username
  password: 'P@ssw0rd@1234', // SQL Server password
  
  options: {
    trustedConnection: true, // Use Windows Authentication
    enableArithAbort: true,  // Recommended setting for SQL Server
    encrypt: true, // Keep encryption enabled
    trustServerCertificate: true,
  },
  port: 1433 // SQL Server port
};

// Create tasks table if it doesn't exist
async function createTables(pool) {
  try {
    // Create users table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
      BEGIN
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          email NVARCHAR(255) NOT NULL UNIQUE,
          password NVARCHAR(255) NOT NULL,
          role NVARCHAR(50) NOT NULL DEFAULT 'USER',
          created_at DATETIME NOT NULL DEFAULT GETDATE()
        )
      END
    `);
    console.log('Users table created or already exists');

    // Create projects table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND type in (N'U'))
      BEGIN
        CREATE TABLE projects (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          created_at DATETIME NOT NULL DEFAULT GETDATE()
        )
      END
      ELSE
      BEGIN
        -- Add created_at column if it doesn't exist
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[projects]') AND name = 'created_at')
        BEGIN
          ALTER TABLE projects ADD created_at DATETIME NOT NULL DEFAULT GETDATE()
        END
      END
    `);
    console.log('Projects table created or already exists');

    // Create tasks table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[tasks]') AND type in (N'U'))
      BEGIN
        CREATE TABLE tasks (
          id INT IDENTITY(1,1) PRIMARY KEY,
          task NVARCHAR(255) NOT NULL,
          project_id INT NOT NULL,
          assigned_to INT,
          description NVARCHAR(MAX),
          status NVARCHAR(50) NOT NULL DEFAULT 'pending',
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME,
          FOREIGN KEY (project_id) REFERENCES projects(id),
          FOREIGN KEY (assigned_to) REFERENCES users(id)
        )
      END
    `);
    console.log('Tasks table created or already exists');

    // Create resources table if it doesn't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[resources]') AND type in (N'U'))
      BEGIN
        CREATE TABLE resources (
          id INT IDENTITY(1,1) PRIMARY KEY,
          project_id INT NOT NULL,
          title NVARCHAR(255) NOT NULL,
          type NVARCHAR(50) NOT NULL,
          url NVARCHAR(MAX),
          file_path NVARCHAR(255),
          file_type NVARCHAR(50),
          created_at DATETIME NOT NULL DEFAULT GETDATE(),
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )
      END
    `);
    console.log('Resources table created or already exists');

    // Insert default users if they don't exist
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM users WHERE email = 'manager@example.com')
      BEGIN
        INSERT INTO users (name, email, password, role)
        VALUES ('Manager User', 'manager@example.com', 'password', 'MANAGER')
      END
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM users WHERE email = 'user@example.com')
      BEGIN
        INSERT INTO users (name, email, password, role)
        VALUES ('Regular User', 'user@example.com', 'password', 'USER')
      END
    `);
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize the filename
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = Date.now() + '-' + sanitizedFilename;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Define allowed file types
    const documentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    const videoTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
      'video/webm'
    ];

    const allowedTypes = [...documentTypes, ...videoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, MP4, MOV, AVI, MKV, WEBM'));
    }
  }
});

// Connect to SQL Server
sql.connect(config).then(async pool => {
  if (pool.connected) {
    console.log('Connected to SQL Server');
    await createTables(pool);
  }

  // API Endpoints
  app.get('/api/checklist', async (req, res) => {
    const { projectId } = req.query;
    const userId = req.headers['user-id']; // Get user ID from request headers

    if (!userId) {
      return res.status(401).json({ error: 'User ID not provided' });
    }

    try {
      let query = `
        SELECT t.*, p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.assigned_to = @userId
      `;

      if (projectId) {
        query += ` AND t.project_id = @projectId`;
      }

      query += ` ORDER BY t.status, t.id DESC`;

      const request = pool.request();
      request.input('userId', sql.Int, userId);
      if (projectId) {
        request.input('projectId', sql.Int, projectId);
      }

      const result = await request.query(query);
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching checklist:', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.get('/api/resources', (req, res) => {
    // Dummy data for resources
    const dummyResources = [
      { id: 1, type: "document", title: "Project Plan", link: "#" },
      { id: 2, type: "video", title: "Onboarding Video", link: "#" }
    ];
    res.json(dummyResources);
  });

  app.get('/api/projects', async (req, res) => {
    try {
      const result = await pool.request()
        .query(`
          SELECT 
            p.id,
            p.name,
            ISNULL(p.created_at, GETDATE()) as created_at,
            COUNT(DISTINCT t.id) as task_count,
            COUNT(DISTINCT r.id) as resource_count
          FROM projects p
          LEFT JOIN tasks t ON p.id = t.project_id
          LEFT JOIN resources r ON p.id = r.project_id
          GROUP BY p.id, p.name, p.created_at
          ORDER BY p.created_at DESC
        `);
      
      console.log('Projects fetched successfully:', result.recordset);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ 
        error: 'Failed to fetch projects',
        details: error.message
      });
    }
  });

  // Create new project
  app.post('/api/projects', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const result = await pool.request()
        .input('name', sql.NVarChar(255), name)
        .query(`
          INSERT INTO projects (name)
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.created_at
          VALUES (@name)
        `);

      res.status(201).json(result.recordset[0]);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  });

  // Update project
  app.put('/api/projects/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('name', sql.NVarChar(255), name)
        .query(`
          UPDATE projects
          SET name = @name
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.created_at
          WHERE id = @id
        `);

      if (!result.recordset.length) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  });

  // Delete project and all associated resources
  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const { id } = req.params;

      // Start a transaction
      const transaction = new sql.Transaction(pool);

      try {
        // First, get all resources for this project
        const resourcesResult = await transaction.request()
          .input('projectId', sql.Int, id)
          .query('SELECT file_path FROM resources WHERE project_id = @projectId');

        // Delete files from the filesystem
        for (const resource of resourcesResult.recordset) {
          if (resource.file_path) {
            const filePath = path.join(__dirname, 'uploads', resource.file_path);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        }

        // Delete all resources for this project
        await transaction.request()
          .input('projectId', sql.Int, id)
          .query('DELETE FROM resources WHERE project_id = @projectId');

        // Delete all tasks for this project
        await transaction.request()
          .input('projectId', sql.Int, id)
          .query('DELETE FROM tasks WHERE project_id = @projectId');

        // Finally, delete the project
        const result = await transaction.request()
          .input('id', sql.Int, id)
          .query('DELETE FROM projects WHERE id = @id');

        if (!result.rowsAffected[0]) {
          await transaction.rollback();
          return res.status(404).json({ error: 'Project not found' });
        }

        // Commit the transaction
        await transaction.commit();
        res.json({ message: 'Project and all associated resources deleted successfully' });
      } catch (error) {
        // Rollback the transaction if there's an error
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Failed to delete project' });
    }
  });

  app.get('/api/users', async (req, res) => {
    try {
      console.log('Fetching users...');
      const result = await pool.request().query(`
        SELECT id, email, role 
        FROM users 
        WHERE role = 'USER'
        ORDER BY email
      `);
      
      console.log(`Found ${result.recordset.length} users`);
      res.json(result.recordset);
    } catch (err) {
      console.error('Error fetching users:', err);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        details: err.message
      });
    }
  });

  // Add new task (manager only)
  app.post('/api/checklist', async (req, res) => {
    const { task, projectId, status, assignedTo } = req.body;
    
    // Validate required fields
    if (!task || !projectId) {
      return res.status(400).json({ 
        error: 'Task and project ID are required',
        details: 'Please provide both task name and project ID'
      });
    }

    try {
      // First verify if the project exists
      const projectCheck = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query('SELECT id FROM projects WHERE id = @projectId');

      if (!projectCheck.recordset.length) {
        return res.status(404).json({ 
          error: 'Project not found',
          details: `No project found with ID: ${projectId}`
        });
      }

      // If assignedTo is provided, verify if the user exists
      if (assignedTo) {
        const userCheck = await pool.request()
          .input('assignedTo', sql.Int, assignedTo)
          .query('SELECT id FROM users WHERE id = @assignedTo');

        if (!userCheck.recordset.length) {
          return res.status(404).json({ 
            error: 'User not found',
            details: `No user found with ID: ${assignedTo}`
          });
        }
      }

      // Insert the task
      const result = await pool.request()
        .input('task', sql.VarChar(255), task)
        .input('projectId', sql.Int, projectId)
        .input('status', sql.NVarChar(50), status || 'pending')
        .input('assignedTo', sql.Int, assignedTo || null)
        .query(`
          INSERT INTO tasks (task, project_id, status, assigned_to)
          VALUES (@task, @projectId, @status, @assignedTo);
          SELECT SCOPE_IDENTITY() AS id;
        `);
      
      // Return the created task
      const newTask = await pool.request()
        .input('id', sql.Int, result.recordset[0].id)
        .query(`
          SELECT t.*, p.name as project_name, u.email as assigned_to_email
          FROM tasks t
          LEFT JOIN projects p ON t.project_id = p.id
          LEFT JOIN users u ON t.assigned_to = u.id
          WHERE t.id = @id
        `);

      res.status(201).json(newTask.recordset[0]);
    } catch (err) {
      console.error('Error adding task:', err);
      res.status(500).json({ 
        error: 'Failed to add task',
        details: err.message
      });
    }
  });

  // Update task status (user only)
  app.put('/api/checklist/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['pending', 'complete'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        details: 'Status must be either "pending" or "complete"'
      });
    }

    try {
      // First check if the task exists
      const taskCheck = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT id FROM tasks WHERE id = @id');

      if (!taskCheck.recordset.length) {
        return res.status(404).json({ 
          error: 'Task not found',
          details: `No task found with ID: ${id}`
        });
      }

      // Update the task status
      const result = await pool.request()
        .input('id', sql.Int, id)
        .input('status', sql.NVarChar(50), status)
        .query(`
          UPDATE tasks 
          SET status = @status
          WHERE id = @id;
        `);

      if (result.rowsAffected[0] > 0) {
        // Fetch the updated task
        const updatedTask = await pool.request()
          .input('id', sql.Int, id)
          .query(`
            SELECT t.*, p.name as project_name, u.email as assigned_to_email
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = @id
          `);

        res.json(updatedTask.recordset[0]);
      } else {
        res.status(404).json({ error: 'Task not found' });
      }
    } catch (err) {
      console.error('Error updating task:', err);
      res.status(500).json({ 
        error: 'Failed to update task',
        details: err.message 
      });
    }
  });

  // Delete task (manager only)
  app.delete('/api/checklist/:id', async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM tasks WHERE id = @id');

      if (result.rowsAffected[0] > 0) {
        res.json({ message: 'Task deleted successfully' });
      } else {
        res.status(404).json({ error: 'Task not found' });
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Add sample tasks
  app.post('/api/checklist/sample', async (req, res) => {
    try {
      // First, get a project ID
      const projectResult = await pool.request().query('SELECT TOP 1 id FROM projects');
      const projectId = projectResult.recordset[0]?.id;

      if (!projectId) {
        return res.status(400).send('No projects found. Please create a project first.');
      }

      // Sample tasks
      const sampleTasks = [
        { task: 'Complete employee profile', projectId, status: 'pending' },
        { task: 'Review company policies', projectId, status: 'pending' },
        { task: 'Set up development environment', projectId, status: 'pending' },
        { task: 'Attend team introduction meeting', projectId, status: 'pending' },
        { task: 'Complete security training', projectId, status: 'pending' }
      ];

      for (const task of sampleTasks) {
        await pool.request()
          .input('task', sql.NVarChar, task.task)
          .input('projectId', sql.Int, task.projectId)
          .input('status', sql.NVarChar, task.status)
          .query(`
            INSERT INTO tasks (task, project_id, status, created_at)
            VALUES (@task, @projectId, @status, GETDATE());
          `);
      }

      res.status(201).send('Sample tasks added successfully');
    } catch (err) {
      console.error('Error adding sample tasks:', err);
      res.status(500).send('Error adding sample tasks');
    }
  });

  // Get resources for a specific project
  app.get('/api/resources/:projectId', async (req, res) => {
    try {
      const { projectId } = req.params;
      const result = await pool.request()
        .input('project_id', sql.Int, projectId)
        .query(`
          SELECT r.*, p.name as project_name 
          FROM resources r
          JOIN projects p ON r.project_id = p.id
          WHERE r.project_id = @project_id
          ORDER BY r.created_at DESC
        `);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ error: 'Failed to fetch resources' });
    }
  });

  // Add resource
  app.post('/api/resources', async (req, res) => {
    try {
      const { title, type, url, projectId, filePath, fileType } = req.body;
      
      console.log('Received resource data:', req.body);

      // Validate required fields
      if (!title || !type || !projectId) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          details: 'Title, type, and project ID are required'
        });
      }

      // Validate resource type
      if (!['document', 'video', 'link'].includes(type)) {
        return res.status(400).json({
          error: 'Invalid resource type',
          details: 'Type must be one of: document, video, link'
        });
      }

      // Validate URL for link type
      if (type === 'link' && !url) {
        return res.status(400).json({
          error: 'URL required for link type',
          details: 'Please provide a URL for link type resources'
        });
      }

      // Validate file for document/video type
      if ((type === 'document' || type === 'video') && (!filePath || !fileType)) {
        return res.status(400).json({
          error: 'File required for document/video type',
          details: 'Please upload a file for document/video type resources'
        });
      }

      // First verify if the project exists
      const projectCheck = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query('SELECT id FROM projects WHERE id = @projectId');

      if (!projectCheck.recordset.length) {
        return res.status(404).json({ 
          error: 'Project not found',
          details: `No project found with ID: ${projectId}`
        });
      }

      // Insert into database
      const result = await pool.request()
        .input('project_id', sql.Int, projectId)
        .input('title', sql.NVarChar(255), title)
        .input('type', sql.NVarChar(50), type)
        .input('url', sql.NVarChar(sql.MAX), type === 'link' ? url : null)
        .input('file_path', sql.NVarChar(255), (type === 'document' || type === 'video') ? filePath : null)
        .input('file_type', sql.NVarChar(100), (type === 'document' || type === 'video') ? fileType : null)
        .query(`
          INSERT INTO resources (project_id, title, type, url, file_path, file_type)
          OUTPUT INSERTED.id
          VALUES (@project_id, @title, @type, @url, @file_path, @file_type)
        `);

      if (!result.recordset || !result.recordset[0]) {
        throw new Error('Failed to insert resource into database');
      }

      const resourceId = result.recordset[0].id;

      // Fetch the created resource
      const newResource = await pool.request()
        .input('id', sql.Int, resourceId)
        .query(`
          SELECT r.*, p.name as project_name 
          FROM resources r
          JOIN projects p ON r.project_id = p.id
          WHERE r.id = @id
        `);

      if (!newResource.recordset || !newResource.recordset[0]) {
        throw new Error('Failed to fetch created resource');
      }

      res.status(201).json(newResource.recordset[0]);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ 
        error: 'Failed to create resource', 
        details: error.message,
        stack: error.stack 
      });
    }
  });

  // Delete resource
  app.delete('/api/resources/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the resource to check if it has a file
      const resource = await pool.request()
        .input('id', sql.Int, id)
        .query('SELECT file_path FROM resources WHERE id = @id');
      
      if (resource.recordset.length > 0 && resource.recordset[0].file_path) {
        // Delete the file if it exists
        const filePath = path.join(__dirname, 'uploads', resource.recordset[0].file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete from database
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM resources WHERE id = @id');

      res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
      console.error('Error deleting resource:', error);
      res.status(500).json({ error: 'Failed to delete resource' });
    }
  });

  // Add new endpoint for file upload
  app.post('/api/resources/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Return the file information
      res.json({
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file', details: error.message });
    }
  });

  // Add endpoint to serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Start the server
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

}).catch(err => {
  console.error('Database connection failed:', err);
});