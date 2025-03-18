const express = require('express');
const router = express.Router();
const sql = require('mssql');

const config = {
  server: 'DESKTOP-VTDJ6NS',
  database: 'onboarding_db',
  user: 'sa',
  password: 'P@ssw0rd@1234',
  options: {
    trustedConnection: true,
    enableArithAbort: true,
    encrypt: true,
    trustServerCertificate: true,
  },
  port: 1433
};

// Define the login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT id, email, role 
        FROM users 
        WHERE email = @email AND password = @password
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

module.exports = router; 