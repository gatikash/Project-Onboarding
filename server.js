const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

const app = express();

// MySQL Connection Pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'onboarding_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize user_projects table
const initializeUserProjects = async () => {
  try {
    const createUserProjectsTable = `
      CREATE TABLE IF NOT EXISTS user_projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id),
        UNIQUE KEY unique_user_project (user_id, project_id)
      )
    `;
    await pool.query(createUserProjectsTable);
    console.log('user_projects table initialized');
  } catch (error) {
    console.error('Error initializing user_projects table:', error);
  }
};

// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await pool.query(
      'SELECT * FROM projects ORDER BY project_name'
    );
    
    res.json({
      success: true,
      projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

// Get all roles
app.get('/api/roles', async (req, res) => {
  try {
    const [roles] = await pool.query(
      'SELECT * FROM roles ORDER BY role_name'
    );
    
    res.json({
      success: true,
      roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles'
    });
  }
});

// Get projects for a specific user based on their role and available resources
app.get('/api/projects/user/:userId', async (req, res) => {
  const userId = req.params.userId;
  console.log('Fetching projects for user:', userId);

  try {
    // Get user's role
    const [userRole] = await pool.query(
      'SELECT role_id FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userRole || userRole.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const roleId = userRole[0].role_id;
    console.log('User role:', roleId);

    // Fetch projects based on role
    let query;
    let queryParams;

    if (roleId === 1) { // Manager
      // Managers can see all projects that have resources
      query = `
        SELECT DISTINCT p.*
        FROM projects p
        INNER JOIN resources r ON p.id = r.project_id
        ORDER BY p.project_name
      `;
      queryParams = [];
    } else {
      // Regular users can only see projects with resources matching their role or null role
      query = `
        SELECT DISTINCT p.*
        FROM projects p
        INNER JOIN resources r ON p.id = r.project_id
        WHERE r.role_id = ? OR r.role_id IS NULL
        ORDER BY p.project_name
      `;
      queryParams = [roleId];
    }

    console.log('Executing query:', query.replace(/\s+/g, ' '), 'with params:', queryParams);
    const [projects] = await pool.query(query, queryParams);
    console.log('Found projects:', projects);

    if (!projects || projects.length === 0) {
      // Check if any resources exist
      const [totalResources] = await pool.query(
        'SELECT COUNT(*) as count FROM resources WHERE role_id = ? OR role_id IS NULL',
        [roleId]
      );
      
      console.log('Diagnostics:', {
        totalResources: totalResources[0].count,
        roleId,
        userId
      });
      
      return res.status(404).json({
        success: false,
        error: 'No projects available for your role.',
        debug: {
          totalResources: totalResources[0].count,
          roleId,
          userId
        }
      });
    }

    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error fetching user projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      debug: { userId, errorMessage: error.message }
    });
  }
});

// Add user to project
app.post('/api/projects/user', async (req, res) => {
  const { userId, projectId } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO user_projects (user_id, project_id) VALUES (?, ?)',
      [userId, projectId]
    );
    
    res.json({
      success: true,
      message: 'User added to project successfully'
    });
  } catch (error) {
    console.error('Error adding user to project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add user to project'
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running correctly'
  });
});

// Initialize test data
const initializeTestData = async () => {
  try {
    console.log('Checking database state...');

    // Debug: Check all tables
    const [projects] = await pool.query('SELECT * FROM projects');
    console.log('All projects:', projects);

    const [users] = await pool.query('SELECT * FROM users');
    console.log('All users:', users);

    const [userProjects] = await pool.query('SELECT * FROM user_projects');
    console.log('All user_projects:', userProjects);

    // If no projects exist, create default project
    if (projects.length === 0) {
      console.log('No projects found. Creating default project...');
      const [result] = await pool.query(
        'INSERT INTO projects (project_name, description) VALUES (?, ?)',
        ['Onboarding Project', 'Default onboarding project for all users']
      );
      console.log('Created default project with ID:', result.insertId);
    }

    // Ensure user 2 has project assignments
    const [user2Projects] = await pool.query(
      'SELECT * FROM user_projects WHERE user_id = ?',
      [2]
    );
    console.log('Projects for user 2:', user2Projects);

    if (user2Projects.length === 0) {
      console.log('No projects assigned to user 2. Assigning to all projects...');
      for (const project of projects) {
        await pool.query(
          'INSERT IGNORE INTO user_projects (user_id, project_id) VALUES (?, ?)',
          [2, project.id]
        );
      }
      console.log('Assigned user 2 to all projects');
    }

    // Verify assignments after changes
    const [finalAssignments] = await pool.query(
      'SELECT up.*, p.project_name FROM user_projects up JOIN projects p ON up.project_id = p.id WHERE up.user_id = ?',
      [2]
    );
    console.log('Final project assignments for user 2:', finalAssignments);

  } catch (error) {
    console.error('Error in database check/repair:', error);
  }
};

// Initialize resources table
const initializeResources = async () => {
  try {
    // Create resources table if it doesn't exist
    const createResourcesTable = `
      CREATE TABLE IF NOT EXISTS resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(255),
        file_type VARCHAR(50),
        project_id INT NOT NULL,
        role_id INT,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )
    `;
    await pool.query(createResourcesTable);
    console.log('Resources table initialized');

    // Check if resources table is empty
    const [existingResources] = await pool.query('SELECT COUNT(*) as count FROM resources');
    
    if (existingResources[0].count === 0) {
      console.log('No resources found. Creating sample resources...');
      
      // Get the first project
      const [projects] = await pool.query('SELECT id FROM projects LIMIT 1');
      if (projects.length > 0) {
        const projectId = projects[0].id;
        
        // Create sample resources
        const sampleResources = [
          {
            title: 'Getting Started Guide',
            description: 'A comprehensive guide for new team members',
            file_path: '/resources/getting-started.pdf',
            file_type: 'PDF',
            project_id: projectId,
            role_id: null, // Available to all roles
            status: 'pending'
          },
          {
            title: 'Manager Guidelines',
            description: 'Guidelines and best practices for managers',
            file_path: '/resources/manager-guidelines.pdf',
            file_type: 'PDF',
            project_id: projectId,
            role_id: 1, // Manager role
            status: 'pending'
          },
          {
            title: 'Employee Handbook',
            description: 'Detailed information for employees',
            file_path: '/resources/employee-handbook.pdf',
            file_type: 'PDF',
            project_id: projectId,
            role_id: 2, // Employee role
            status: 'pending'
          }
        ];

        for (const resource of sampleResources) {
          await pool.query(
            `INSERT INTO resources (
              title, description, file_path, file_type, project_id, role_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              resource.title, 
              resource.description, 
              resource.file_path, 
              resource.file_type, 
              resource.project_id, 
              resource.role_id,
              resource.status
            ]
          );
        }
        console.log('Sample resources created');
      }
    }
  } catch (error) {
    console.error('Error initializing resources table:', error);
  }
};

// Initialize tables on server start
const initializeTables = async () => {
  await initializeUserProjects();
  await initializeResources();
  await initializeTestData();
  // ... other table initializations ...
};

initializeTables().then(() => {
  console.log('All tables initialized');
}).catch(error => {
  console.error('Error initializing tables:', error);
});

// Get resources for a specific project and user role
app.get('/api/resources/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, roleId, filterRole } = req.query;

    console.log('Fetching resources with params:', { projectId, userId, roleId, filterRole });

    if (!projectId || !userId || !roleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    // Check if project exists
    const [project] = await pool.query(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    if (!project.length) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Check if user is assigned to the project (skip for managers)
    if (roleId !== '1') {
      const [userProject] = await pool.query(
        'SELECT * FROM user_projects WHERE user_id = ? AND project_id = ?',
        [userId, projectId]
      );

      if (!userProject.length) {
        return res.status(403).json({
          success: false,
          error: 'User is not assigned to this project'
        });
      }
    }

    let query;
    let queryParams;

    if (roleId === '1') { // Manager
      if (filterRole) {
        query = `
          SELECT 
            r.*,
            p.project_name,
            ro.role_name,
            u.username as assigned_to,
            COALESCE(r.status, 'pending') as status
          FROM resources r
          JOIN projects p ON r.project_id = p.id
          LEFT JOIN roles ro ON r.role_id = ro.id
          LEFT JOIN users u ON r.assigned_to = u.id
          WHERE r.project_id = ? 
          AND (r.role_id = ? OR (? = '' AND r.role_id IS NULL))
          ORDER BY r.created_at DESC
        `;
        queryParams = [projectId, filterRole, filterRole];
      } else {
        query = `
          SELECT 
            r.*,
            p.project_name,
            ro.role_name,
            u.username as assigned_to,
            COALESCE(r.status, 'pending') as status
          FROM resources r
          JOIN projects p ON r.project_id = p.id
          LEFT JOIN roles ro ON r.role_id = ro.id
          LEFT JOIN users u ON r.assigned_to = u.id
          WHERE r.project_id = ?
          ORDER BY r.created_at DESC
        `;
        queryParams = [projectId];
      }
    } else { // Regular user
      query = `
        SELECT 
          r.*,
          p.project_name,
          ro.role_name,
          u.username as assigned_to,
          COALESCE(r.status, 'pending') as status
        FROM resources r
        JOIN projects p ON r.project_id = p.id
        LEFT JOIN roles ro ON r.role_id = ro.id
        LEFT JOIN users u ON r.assigned_to = u.id
        WHERE r.project_id = ?
        AND (r.role_id = ? OR r.role_id IS NULL)
        ORDER BY r.created_at DESC
      `;
      queryParams = [projectId, roleId];
    }

    console.log('Executing query:', query.replace(/\s+/g, ' '));
    console.log('Query params:', queryParams);

    const [resources] = await pool.query(query, queryParams);
    console.log(`Found ${resources.length} resources`);

    res.json({
      success: true,
      resources: resources
    });

  } catch (error) {
    console.error('Error in /api/resources/project/:projectId:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch resources',
      details: error.message
    });
  }
});

// Add a new resource
app.post('/api/resources', upload.single('file'), async (req, res) => {
  try {
    const { title, description, projectId, roleId } = req.body;
    const file = req.file;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        error: 'Title and project ID are required'
      });
    }

    // Get file details if uploaded
    const filePath = file ? file.path : null;
    const fileType = file ? file.mimetype.split('/')[1] : null;

    const [result] = await pool.query(
      `INSERT INTO resources (
        title, 
        description, 
        project_id, 
        role_id,
        file_path,
        file_type,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [title, description, projectId, roleId || null, filePath, fileType]
    );

    res.json({
      success: true,
      resourceId: result.insertId
    });

  } catch (error) {
    console.error('Error adding resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add resource',
      details: error.message
    });
  }
});

// Delete a resource
app.delete('/api/resources/:resourceId', async (req, res) => {
  try {
    const { resourceId } = req.params;

    // Check if resource exists and get file path
    const [resource] = await pool.query(
      'SELECT file_path FROM resources WHERE id = ?',
      [resourceId]
    );

    if (!resource.length) {
      return res.status(404).json({
        success: false,
        error: 'Resource not found'
      });
    }

    // Delete the file if it exists
    if (resource[0].file_path) {
      try {
        fs.unlinkSync(resource[0].file_path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    // Delete the resource
    await pool.query('DELETE FROM resources WHERE id = ?', [resourceId]);

    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete resource',
      details: error.message
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 