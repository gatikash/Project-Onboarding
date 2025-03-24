const express = require('express');
const router = express.Router();
const sql = require('mssql');
const pool = require('../db');

// Define the login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT u.id, u.email, u.role_id, r.role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.email = @email AND u.password = @password
      `);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      res.json({
        id: user.id,
        email: user.email,
        roleId: user.role_id,
        roleName: user.role_name
      });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router; 