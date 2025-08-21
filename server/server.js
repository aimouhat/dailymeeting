import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import fs from 'fs';
<<<<<<< HEAD
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
=======
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;
<<<<<<< HEAD
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
=======
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize SQLite database
let db;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server attached to HTTP server
<<<<<<< HEAD
const wss = new WebSocketServer({
  server,
  path: '/ws',
  clientTracking: true,
  perMessageDeflate: false, // Disable compression for better performance
  maxPayload: 1024 * 1024 // 1MB max payload
=======
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  clientTracking: true,
  perMessageDeflate: false,
  maxPayload: 1024 * 1024
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
});

// Store connected clients with their IP addresses
const clients = new Map();

// Cleanup function for disconnected clients
const cleanupClient = (clientIp) => {
  const ws = clients.get(clientIp);
  if (ws) {
    try {
<<<<<<< HEAD
      ws.close();
=======
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    } catch (error) {
      console.error('Error closing connection for client', clientIp, ':', error);
    }
    clients.delete(clientIp);
  }
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
<<<<<<< HEAD
  const clientIp = req.socket.remoteAddress;
=======
  const clientIp = req.socket.remoteAddress || 'unknown';
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  console.log('New WebSocket connection from:', clientIp);

  // Check if client already has a connection
  if (clients.has(clientIp)) {
    console.log('Client already connected, cleaning up old connection');
    cleanupClient(clientIp);
  }

  // Store the new connection
  clients.set(clientIp, ws);
<<<<<<< HEAD

  // Send initial connection success message
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    message: 'Successfully connected to WebSocket server',
    clientCount: clients.size
  }));

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected:', clientIp);
    cleanupClient(clientIp);
=======
  
  // Send initial connection success message
  try {
    ws.send(JSON.stringify({ 
      type: 'CONNECTED', 
      message: 'Successfully connected to WebSocket server',
      clientCount: clients.size
    }));
  } catch (error) {
    console.error('Error sending initial message:', error);
  }
  
  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected:', clientIp);
    clients.delete(clientIp);
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  });

  // Handle client errors
  ws.on('error', (error) => {
    console.error('WebSocket error for client', clientIp, ':', error);
    cleanupClient(clientIp);
  });

  // Handle pong responses
  ws.on('pong', () => {
    // Client is still alive
  });

  // Send ping every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
<<<<<<< HEAD
    if (ws.readyState === WebSocketServer.OPEN) {
=======
    if (ws.readyState === ws.OPEN) {
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
      try {
        ws.ping();
      } catch (error) {
        console.error('Error sending ping to client', clientIp, ':', error);
        cleanupClient(clientIp);
        clearInterval(pingInterval);
      }
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  // Clean up interval on close
  ws.on('close', () => {
    clearInterval(pingInterval);
  });
});

// Broadcast function to send updates to all connected clients
const broadcastUpdate = (data) => {
  const message = JSON.stringify(data);
<<<<<<< HEAD
  console.log('Broadcasting to', clients.size, 'clients:', message);

  clients.forEach((ws, clientIp) => {
    if (ws.readyState === WebSocketServer.OPEN) {
=======
  console.log('Broadcasting to', clients.size, 'clients:', data.type);
  
  clients.forEach((ws, clientIp) => {
    if (ws.readyState === ws.OPEN) {
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
      try {
        ws.send(message);
      } catch (error) {
        console.error('Error sending message to client', clientIp, ':', error);
        cleanupClient(clientIp);
      }
    } else {
      cleanupClient(clientIp);
    }
  });
};

async function initializeDatabase() {
  try {
<<<<<<< HEAD
    console.log('Initializing database...');
=======
    console.log('Initializing SQLite database...');
    
    // Ensure the database directory exists
    const dbDir = path.dirname(path.join(__dirname, 'daily_meeting.db'));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    // Open database connection
    db = await open({
      filename: path.join(__dirname, 'daily_meeting.db'),
      driver: sqlite3.Database
    });

<<<<<<< HEAD
=======
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    // Create Actions table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actionPlan TEXT NOT NULL,
        tags TEXT,
        area TEXT NOT NULL,
        discipline TEXT NOT NULL,
        assignedTo TEXT,
        fromDate TEXT NOT NULL,
        toDate TEXT NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT NOT NULL,
        comment TEXT,
<<<<<<< HEAD
        criticality TEXT DEFAULT 'Medium'
      )
    `);

    // Create Users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin','user'))
      )
    `);

    // Create ActionHistory table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ActionHistory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actionId INTEGER NOT NULL,
        userId INTEGER,
        username TEXT,
        eventType TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        changes TEXT,
        FOREIGN KEY(actionId) REFERENCES Actions(id)
      )
    `);

    // Ensure an admin user exists
    const admin = await db.get(`SELECT * FROM Users WHERE role = 'admin' LIMIT 1`);
    if (!admin) {
      const defaultAdminUser = process.env.ADMIN_USER || 'admin';
      const defaultAdminPass = process.env.ADMIN_PASS || 'admin123';
      const passwordHash = await bcrypt.hash(defaultAdminPass, 10);
      await db.run(`INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, 'admin')`, [defaultAdminUser, passwordHash]);
      console.log('Created default admin user:', defaultAdminUser);
    }

    // Add criticality column to existing tables if it doesn't exist
    try {
      await db.exec(`ALTER TABLE Actions ADD COLUMN criticality TEXT DEFAULT 'Medium'`);
      console.log('Added criticality column to existing Actions table');
    } catch (err) {
      // Column might already exist, ignore error
      console.log('Criticality column already exists or error adding it:', err.message);
    }

    console.log('Database initialized successfully');
    return true;
  } catch (err) {
    console.error('Database initialization failed:', err);
=======
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create trigger to update updatedAt timestamp
    await db.exec(`
      CREATE TRIGGER IF NOT EXISTS update_actions_timestamp 
      AFTER UPDATE ON Actions
      BEGIN
        UPDATE Actions SET updatedAt = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END
    `);
    
    console.log('✅ SQLite database initialized successfully');
    
    // Test the database connection
    const testQuery = await db.get('SELECT COUNT(*) as count FROM Actions');
    console.log(`📊 Database contains ${testQuery.count} actions`);
    
    return true;
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    return false;
  }
}

// Function to check and update action statuses
async function checkAndUpdateActionStatuses() {
  if (!db) {
    console.error('Database not initialized');
    return;
  }

  try {
    const today = new Date().toISOString().split('T')[0];
<<<<<<< HEAD

    // Get all actions that are In Progress and have passed their toDate
    const overdueActions = await db.all(`
      SELECT * FROM Actions
      WHERE status = 'In Progress'
      AND toDate < ?
=======
    
    // Get all actions that are In Progress and have passed their toDate
    const actions = await db.all(`
      SELECT * FROM Actions 
      WHERE status = 'In Progress' 
      AND toDate < ? 
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
      AND status != 'Delay'
    `, [today]);

    // Update each action's status to Delay
<<<<<<< HEAD
    for (const action of overdueActions) {
      await db.run(`
        UPDATE Actions
        SET status = 'Delay'
=======
    for (const action of actions) {
      await db.run(`
        UPDATE Actions 
        SET status = 'Delay' 
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
        WHERE id = ?
      `, [action.id]);

      // Broadcast the update to all connected clients
      broadcastUpdate({
        type: 'ACTION_UPDATED',
        action: { ...action, status: 'Delay' }
      });
    }

<<<<<<< HEAD
    if (overdueActions.length > 0) {
      console.log(`Updated ${overdueActions.length} actions to Delay status`);
    }

    // Get all actions that are Delay but have toDate >= today (should be back to In Progress)
    const recoveredActions = await db.all(`
      SELECT * FROM Actions
      WHERE status = 'Delay'
      AND toDate >= ?
    `, [today]);

    // Update each action's status back to In Progress
    for (const action of recoveredActions) {
      await db.run(`
        UPDATE Actions
        SET status = 'In Progress'
        WHERE id = ?
      `, [action.id]);

      // Broadcast the update to all connected clients
      broadcastUpdate({
        type: 'ACTION_UPDATED',
        action: { ...action, status: 'In Progress' }
      });
    }

    if (recoveredActions.length > 0) {
      console.log(`Updated ${recoveredActions.length} actions back to In Progress status`);
=======
    if (actions.length > 0) {
      console.log(`Updated ${actions.length} actions to Delay status`);
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    }
  } catch (err) {
    console.error('Error updating action statuses:', err);
  }
}

// Run the status check every hour
setInterval(checkAndUpdateActionStatuses, 60 * 60 * 1000);

<<<<<<< HEAD
// Also run it immediately on server start
checkAndUpdateActionStatuses();

// Create the reports folder in the project root
const REPORTS_FOLDER = process.env.REPORTS_FOLDER
  ? path.isAbsolute(process.env.REPORTS_FOLDER)
    ? process.env.REPORTS_FOLDER
    : path.join(process.cwd(), process.env.REPORTS_FOLDER)
  : path.join(process.cwd(), 'dailyrepport');
=======
// Create the reports folder in the project root
const REPORTS_FOLDER = path.join(process.cwd(), 'Historical Reports');
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b

// Ensure the reports folder exists
if (!fs.existsSync(REPORTS_FOLDER)) {
  console.log('Creating reports folder at:', REPORTS_FOLDER);
  fs.mkdirSync(REPORTS_FOLDER, { recursive: true });
}

<<<<<<< HEAD
// Auth helpers (placed before routes)
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, role }
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// Audit logging helper
async function logActionChange(actionId, reqUser, eventType, changesObj) {
  try {
    const timestamp = new Date().toISOString();
    const userId = reqUser?.id || null;
    const username = reqUser?.username || null;
    const changes = changesObj ? JSON.stringify(changesObj) : null;
    await db.run(
      `INSERT INTO ActionHistory (actionId, userId, username, eventType, timestamp, changes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [actionId, userId, username, eventType, timestamp, changes]
    );
  } catch (e) {
    console.error('Failed to record action history:', e);
  }
}

// Get all reports
app.get('/api/reports', requireAuth, (req, res) => {
=======
// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: db ? 'Connected' : 'Disconnected',
    websocket: wss ? 'Running' : 'Stopped'
  });
});

// Get all reports
app.get('/api/reports', (req, res) => {
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  try {
    console.log('Reading reports from folder:', REPORTS_FOLDER);
    const files = fs.readdirSync(REPORTS_FOLDER);
    console.log('Found files:', files);

    const reports = files
      .filter(file => file.endsWith('.pdf'))
      .map(file => {
        const dateMatch = file.match(/\d{4}-\d{2}-\d{2}/);
        const date = dateMatch ? dateMatch[0] : '';
        const filePath = path.join(REPORTS_FOLDER, file);
<<<<<<< HEAD
        console.log('Processing file:', file, 'at path:', filePath);
=======
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
        return {
          id: file,
          date,
          fileName: file,
          filePath
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

<<<<<<< HEAD
    console.log('Sending reports:', reports);
=======
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    res.json(reports);
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({ error: 'Failed to read reports', details: error.message });
  }
});

// Save a new report
<<<<<<< HEAD
app.post('/api/reports', requireAuth, (req, res) => {
  try {
    console.log('Received save report request');
    const { fileName, pdfData } = req.body;

=======
app.post('/api/reports', (req, res) => {
  try {
    console.log('Received save report request');
    const { fileName, pdfData } = req.body;
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    if (!fileName || !pdfData) {
      console.error('Missing required fields:', { fileName, hasPdfData: !!pdfData });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const filePath = path.join(REPORTS_FOLDER, fileName);
    console.log('Saving report to:', filePath);
<<<<<<< HEAD

    // Convert base64 to buffer and save
=======
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    try {
      const base64Data = pdfData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid PDF data format');
      }
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, pdfBuffer);
      console.log('Report saved successfully');
      res.json({ success: true, filePath });
    } catch (error) {
      console.error('Error processing PDF data:', error);
      res.status(500).json({ error: 'Failed to process PDF data', details: error.message });
    }
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
});

// Serve PDF files
<<<<<<< HEAD
app.get('/api/reports/:filename', requireAuth, (req, res) => {
  try {
    const filePath = path.join(REPORTS_FOLDER, req.params.filename);
    console.log('Serving file:', filePath);

=======
app.get('/api/reports/:filename', (req, res) => {
  try {
    const filePath = path.join(REPORTS_FOLDER, req.params.filename);
    console.log('Serving file:', filePath);
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', filePath);
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file', details: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Daily Meeting Manager API',
    version: '1.0.0',
<<<<<<< HEAD
    endpoints: {
      getAllActions: 'GET /api/actions',
      createAction: 'POST /api/actions',
      updateAction: 'PUT /api/actions/:id'
=======
    status: 'Running',
    endpoints: {
      health: 'GET /health',
      getAllActions: 'GET /api/actions',
      createAction: 'POST /api/actions',
      updateAction: 'PUT /api/actions/:id',
      deleteAction: 'DELETE /api/actions/:id',
      getAllReports: 'GET /api/reports',
      saveReport: 'POST /api/reports',
      getReport: 'GET /api/reports/:filename'
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    }
  });
});

<<<<<<< HEAD
// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const user = await db.get(`SELECT * FROM Users WHERE username = ?`, [username]);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// User management (admin)
app.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const rows = await db.all(`SELECT id, username, role FROM Users ORDER BY id ASC`);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Missing fields' });
  if (!['admin','user'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const exists = await db.get(`SELECT id FROM Users WHERE username = ?`, [username]);
    if (exists) return res.status(409).json({ error: 'Username already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(`INSERT INTO Users (username, passwordHash, role) VALUES (?, ?, ?)`, [username, passwordHash, role]);
    res.status(201).json({ id: result.lastID, username, role });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.delete('/api/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Prevent admin from deleting themselves optionally
    await db.run(`DELETE FROM Users WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Test endpoint to add a sample action
app.post('/api/test-action', async (req, res) => {
  try {
    const testAction = {
      actionPlan: 'Test Action Plan',
      tags: 'test',
      area: 'Storage and handling',
      discipline: 'Mechanical',
      assignedTo: 'Test User',
      fromDate: new Date().toISOString().split('T')[0],
      toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      duration: 7,
      status: 'Not started',
      comment: 'This is a test action'
    };

    const result = await db.run(`
      INSERT INTO Actions (
        actionPlan, tags, area, discipline, assignedTo,
        fromDate, toDate, duration, status, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testAction.actionPlan,
      testAction.tags,
      testAction.area,
      testAction.discipline,
      testAction.assignedTo,
      testAction.fromDate,
      testAction.toDate,
      testAction.duration,
      testAction.status,
      testAction.comment
    ]);

    const id = result.lastID;
    res.status(201).json({ id, ...testAction });
  } catch (err) {
    console.error('Error adding test action:', err);
    res.status(500).json({ error: 'Failed to add test action' });
  }
});

// API Routes
app.get('/api/actions', requireAuth, async (req, res) => {
  try {
    // First check and update any overdue actions
    const today = new Date().toISOString().split('T')[0];

    // Get all actions that are In Progress and have passed their toDate
    const overdueActions = await db.all(`
      SELECT * FROM Actions
      WHERE status = 'In Progress'
      AND toDate < ?
=======
// API Routes
app.get('/api/actions', async (req, res) => {
  try {
    if (!db) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // First check and update any overdue actions
    const today = new Date().toISOString().split('T')[0];
    
    // Get all actions that are In Progress and have passed their toDate
    const overdueActions = await db.all(`
      SELECT * FROM Actions 
      WHERE status = 'In Progress' 
      AND toDate < ? 
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
      AND status != 'Delay'
    `, [today]);

    // Update each action's status to Delay
    for (const action of overdueActions) {
      await db.run(`
<<<<<<< HEAD
        UPDATE Actions
        SET status = 'Delay'
=======
        UPDATE Actions 
        SET status = 'Delay' 
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
        WHERE id = ?
      `, [action.id]);

      // Broadcast the update to all connected clients
      broadcastUpdate({
        type: 'ACTION_UPDATED',
        action: { ...action, status: 'Delay' }
      });
    }

    if (overdueActions.length > 0) {
      console.log(`Updated ${overdueActions.length} actions to Delay status`);
    }

    // Now fetch all actions with updated statuses
<<<<<<< HEAD
    const actions = await db.all('SELECT id, actionPlan, tags, area, discipline, assignedTo, fromDate, toDate, duration, status, comment as notes, criticality FROM Actions ORDER BY fromDate DESC');
    res.json(actions);
  } catch (err) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

app.post('/api/actions', requireAuth, async (req, res) => {
  console.log('Received action data:', req.body);
  const {
    actionPlan,
    tags,
    area,
    discipline,
    assignedTo,
    fromDate,
    toDate,
    status,
    notes,
    duration,
    criticality
  } = req.body;

=======
    const actions = await db.all('SELECT id, actionPlan, tags, area, discipline, assignedTo, fromDate, toDate, duration, status, comment as notes FROM Actions ORDER BY fromDate DESC');
    res.json(actions);
  } catch (err) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Failed to fetch actions', details: err.message });
  }
});

app.post('/api/actions', async (req, res) => {
  console.log('Received action data:', req.body);
  const { 
    actionPlan, 
    tags, 
    area, 
    discipline, 
    assignedTo, 
    fromDate, 
    toDate, 
    status, 
    notes,
    duration 
  } = req.body;
  
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  // Validate required fields
  if (!actionPlan || !area || !discipline || !fromDate || !toDate || !status) {
    console.error('Missing required fields:', { actionPlan, area, discipline, fromDate, toDate, status });
    return res.status(400).json({ error: 'Missing required fields' });
  }

<<<<<<< HEAD
=======
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  try {
    // Use provided duration or calculate it
    const calculatedDuration = duration || Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));

    const result = await db.run(`
      INSERT INTO Actions (
<<<<<<< HEAD
        actionPlan, tags, area, discipline, assignedTo,
        fromDate, toDate, duration, status, comment, criticality
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
=======
        actionPlan, tags, area, discipline, assignedTo, 
        fromDate, toDate, duration, status, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    `, [
      actionPlan,
      tags || '',
      area,
      discipline,
      assignedTo || '',
      fromDate,
      toDate,
      calculatedDuration,
      status,
<<<<<<< HEAD
      notes || '',
      criticality || 'Medium'
    ]);

=======
      notes || ''
    ]);
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    const newAction = {
      id: result.lastID,
      actionPlan,
      tags,
      area,
      discipline,
      assignedTo,
      fromDate,
      toDate,
      duration: calculatedDuration,
      status,
<<<<<<< HEAD
      notes,
      criticality: criticality || 'Medium'
    };

    console.log('Successfully added new action:', newAction);

    // Log creation
    await logActionChange(newAction.id, req.user, 'CREATED', { after: newAction });

=======
      notes
    };
    
    console.log('Successfully added new action:', newAction);
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    // Broadcast the new action to all connected clients
    broadcastUpdate({
      type: 'NEW_ACTION',
      action: newAction
    });
<<<<<<< HEAD

=======
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    res.status(201).json(newAction);
  } catch (err) {
    console.error('Error inserting action:', err);
    res.status(500).json({ error: err.message || 'Failed to add action' });
  }
});

<<<<<<< HEAD
app.put('/api/actions/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  // Snapshot before update for diff
  const before = await db.get('SELECT * FROM Actions WHERE id = ?', [id]);
  const {
    actionPlan,
    tags,
    area,
    discipline,
    assignedTo,
    fromDate,
    toDate,
    duration,
    status,
    notes,
    criticality
  } = req.body;

  // Compute what the user is proposing to change (mapped to DB columns)
  const userProposed = {
    actionPlan,
    tags: tags || '',
    area,
    discipline,
    assignedTo: assignedTo || '',
    fromDate,
    toDate,
    duration,
    status,
    comment: notes || '',
    criticality: criticality || 'Medium'
  };

  // Normalize and detect no-op updates before touching the DB
  const normalize = (v) => String(v ?? '').trim();
  const fields = ['actionPlan','tags','area','discipline','assignedTo','fromDate','toDate','duration','status','comment','criticality'];
  const changedUserFields = fields.filter(f => normalize(before[f]) !== normalize(userProposed[f]));
  const today = new Date().toISOString().split('T')[0];
  let willAutoChangeStatus = false;
  if (userProposed.toDate) {
    if (normalize(userProposed.toDate) < today && userProposed.status === 'In Progress') willAutoChangeStatus = true;
    if (normalize(userProposed.toDate) >= today && userProposed.status === 'Delay') willAutoChangeStatus = true;
  }
  if (changedUserFields.length === 0 && !willAutoChangeStatus) {
    // No actual user changes and no automatic status change needed → skip update/log
    return res.json({ id, ...req.body, status: before.status, notes: before.comment });
  }

  try {
    await db.run(`
      UPDATE Actions
=======
app.put('/api/actions/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    actionPlan, 
    tags, 
    area, 
    discipline, 
    assignedTo, 
    fromDate, 
    toDate, 
    duration, 
    status, 
    notes 
  } = req.body;
  
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  try {
    const result = await db.run(`
      UPDATE Actions 
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
      SET actionPlan = ?,
          tags = ?,
          area = ?,
          discipline = ?,
          assignedTo = ?,
          fromDate = ?,
          toDate = ?,
          duration = ?,
          status = ?,
<<<<<<< HEAD
          comment = ?,
          criticality = ?
=======
          comment = ?
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
      WHERE id = ?
    `, [
      actionPlan,
      tags || '',
      area,
      discipline,
      assignedTo || '',
      fromDate,
      toDate,
      duration,
      status,
      notes || '',
<<<<<<< HEAD
      criticality || 'Medium',
      id
    ]);

    // Check if we need to update the status based on the new dates
    let updatedStatus = status;

    if (toDate < today && status === 'In Progress') {
      // Action is overdue, change to Delay
      updatedStatus = 'Delay';
      await db.run(`UPDATE Actions SET status = 'Delay' WHERE id = ?`, [id]);
    } else if (toDate >= today && status === 'Delay') {
      // Action is no longer overdue, change back to In Progress
      updatedStatus = 'In Progress';
      await db.run(`UPDATE Actions SET status = 'In Progress' WHERE id = ?`, [id]);
    }

    // Get the updated action to broadcast
    const updatedAction = await db.get('SELECT * FROM Actions WHERE id = ?', [id]);

    // Log update with diff (only if user actually changed fields)
    if (before && updatedAction) {
      const changedFields = fields.filter(f => normalize(before[f]) !== normalize(updatedAction[f]));
      if (changedUserFields.length > 0 && changedFields.length > 0) {
        await logActionChange(Number(id), req.user, 'UPDATED', {
          changedFields,
          before: fields.reduce((acc, f) => { acc[f] = before[f]; return acc; }, {}),
          after: fields.reduce((acc, f) => { acc[f] = updatedAction[f]; return acc; }, {})
        });
      }
    }

    // Broadcast the update to all connected clients
    broadcastUpdate({
      type: 'ACTION_UPDATED',
      action: {
        ...updatedAction,
        notes: updatedAction.comment,
        status: updatedStatus
      }
    });

    res.json({ id, ...req.body, status: updatedStatus });
  } catch (err) {
    console.error('Error updating action:', err);
    res.status(500).json({ error: 'Failed to update action' });
=======
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Action not found' });
    }
    
    const updatedAction = { id: parseInt(id), ...req.body };
    
    // Broadcast the update to all connected clients
    broadcastUpdate({
      type: 'ACTION_UPDATED',
      action: updatedAction
    });
    
    res.json(updatedAction);
  } catch (err) {
    console.error('Error updating action:', err);
    res.status(500).json({ error: 'Failed to update action', details: err.message });
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
  }
});

// Add DELETE endpoint
<<<<<<< HEAD
app.delete('/api/actions/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  console.log('Attempting to delete action with ID:', id);
=======
app.delete('/api/actions/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Attempting to delete action with ID:', id);
  
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b

  try {
    // First check if the action exists
    const action = await db.get('SELECT * FROM Actions WHERE id = ?', [id]);
    if (!action) {
      console.log('Action not found:', id);
      return res.status(404).json({ error: 'Action not found' });
    }

    // Delete the action
    const result = await db.run('DELETE FROM Actions WHERE id = ?', [id]);
    console.log('Delete result:', result);
<<<<<<< HEAD

=======
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    if (result.changes === 0) {
      console.log('No action was deleted');
      return res.status(404).json({ error: 'Action not found' });
    }
<<<<<<< HEAD

    // Log deletion with snapshot
    await logActionChange(Number(id), req.user, 'DELETED', { before: action });

=======
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    // Broadcast the deletion to all connected clients
    const deleteMessage = {
      type: 'DELETE_ACTION',
      id: parseInt(id)
    };
    console.log('Broadcasting delete message:', deleteMessage);
    broadcastUpdate(deleteMessage);
<<<<<<< HEAD

=======
    
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    res.json({ message: 'Action deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('Error deleting action:', err);
    res.status(500).json({ error: 'Failed to delete action: ' + err.message });
  }
});

<<<<<<< HEAD
// History endpoints
app.get('/api/actions/:id/history', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const logs = await db.all(
      `SELECT id, actionId, userId, username, eventType, timestamp, changes
       FROM ActionHistory WHERE actionId = ? ORDER BY timestamp DESC`,
      [id]
    );
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/audit-logs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const logs = await db.all(
      `SELECT id, actionId, userId, username, eventType, timestamp, changes
       FROM ActionHistory ORDER BY timestamp DESC LIMIT 500`
    );
    res.json(logs);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

=======
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something broke!',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

<<<<<<< HEAD
// Start the server
server.listen(PORT, '0.0.0.0', async () => {
  try {
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('Failed to initialize database. Server may not function correctly.');
    }
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket server is running on ws://0.0.0.0:${PORT}/ws`);
    console.log(`API Documentation available at http://localhost:${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
=======
// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  
  // Close WebSocket connections
  wss.clients.forEach((ws) => {
    ws.close();
  });
  
  // Close database connection
  if (db) {
    await db.close();
    console.log('Database connection closed');
  }
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', async () => {
  try {
    console.log('🚀 Starting Daily Meeting Manager Backend...');
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.error('❌ Failed to initialize database. Server may not function correctly.');
      process.exit(1);
    }
    
    // Run initial status check
    await checkAndUpdateActionStatuses();
    
    console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
    console.log(`🔌 WebSocket server is running on ws://0.0.0.0:${PORT}/ws`);
    console.log(`📚 API Documentation available at http://localhost:${PORT}`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
    console.log('📁 Reports folder:', REPORTS_FOLDER);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    process.exit(1);
  }
});