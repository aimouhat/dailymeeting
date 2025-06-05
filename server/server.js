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

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

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
const wss = new WebSocketServer({ 
  server,
  path: '/ws',
  clientTracking: true,
  perMessageDeflate: false, // Disable compression for better performance
  maxPayload: 1024 * 1024 // 1MB max payload
});

// Store connected clients with their IP addresses
const clients = new Map();

// Cleanup function for disconnected clients
const cleanupClient = (clientIp) => {
  const ws = clients.get(clientIp);
  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.error('Error closing connection for client', clientIp, ':', error);
    }
    clients.delete(clientIp);
  }
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log('New WebSocket connection from:', clientIp);

  // Check if client already has a connection
  if (clients.has(clientIp)) {
    console.log('Client already connected, cleaning up old connection');
    cleanupClient(clientIp);
  }

  // Store the new connection
  clients.set(clientIp, ws);
  
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
    if (ws.readyState === WebSocketServer.OPEN) {
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
  console.log('Broadcasting to', clients.size, 'clients:', message);
  
  clients.forEach((ws, clientIp) => {
    if (ws.readyState === WebSocketServer.OPEN) {
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
    console.log('Initializing database...');
    // Open database connection
    db = await open({
      filename: path.join(__dirname, 'daily_meeting.db'),
      driver: sqlite3.Database
    });

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
        comment TEXT
      )
    `);
    
    console.log('Database initialized successfully');
    return true;
  } catch (err) {
    console.error('Database initialization failed:', err);
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
    
    // Get all actions that are In Progress and have passed their toDate
    const actions = await db.all(`
      SELECT * FROM Actions 
      WHERE status = 'In Progress' 
      AND toDate < ? 
      AND status != 'Delay'
    `, [today]);

    // Update each action's status to Delay
    for (const action of actions) {
      await db.run(`
        UPDATE Actions 
        SET status = 'Delay' 
        WHERE id = ?
      `, [action.id]);

      // Broadcast the update to all connected clients
      broadcastUpdate({
        type: 'ACTION_UPDATED',
        action: { ...action, status: 'Delay' }
      });
    }

    if (actions.length > 0) {
      console.log(`Updated ${actions.length} actions to Delay status`);
    }
  } catch (err) {
    console.error('Error updating action statuses:', err);
  }
}

// Run the status check every hour
setInterval(checkAndUpdateActionStatuses, 60 * 60 * 1000);

// Also run it immediately on server start
checkAndUpdateActionStatuses();

// Create the reports folder in the project root
const REPORTS_FOLDER = path.join(process.cwd(), 'Historical Reports');

// Ensure the reports folder exists
if (!fs.existsSync(REPORTS_FOLDER)) {
  console.log('Creating reports folder at:', REPORTS_FOLDER);
  fs.mkdirSync(REPORTS_FOLDER, { recursive: true });
}

// Get all reports
app.get('/api/reports', (req, res) => {
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
        console.log('Processing file:', file, 'at path:', filePath);
        return {
          id: file,
          date,
          fileName: file,
          filePath
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('Sending reports:', reports);
    res.json(reports);
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({ error: 'Failed to read reports', details: error.message });
  }
});

// Save a new report
app.post('/api/reports', (req, res) => {
  try {
    console.log('Received save report request');
    const { fileName, pdfData } = req.body;
    
    if (!fileName || !pdfData) {
      console.error('Missing required fields:', { fileName, hasPdfData: !!pdfData });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const filePath = path.join(REPORTS_FOLDER, fileName);
    console.log('Saving report to:', filePath);
    
    // Convert base64 to buffer and save
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
app.get('/api/reports/:filename', (req, res) => {
  try {
    const filePath = path.join(REPORTS_FOLDER, req.params.filename);
    console.log('Serving file:', filePath);
    
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
    endpoints: {
      getAllActions: 'GET /api/actions',
      createAction: 'POST /api/actions',
      updateAction: 'PUT /api/actions/:id'
    }
  });
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
app.get('/api/actions', async (req, res) => {
  try {
    // First check and update any overdue actions
    const today = new Date().toISOString().split('T')[0];
    
    // Get all actions that are In Progress and have passed their toDate
    const overdueActions = await db.all(`
      SELECT * FROM Actions 
      WHERE status = 'In Progress' 
      AND toDate < ? 
      AND status != 'Delay'
    `, [today]);

    // Update each action's status to Delay
    for (const action of overdueActions) {
      await db.run(`
        UPDATE Actions 
        SET status = 'Delay' 
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
    const actions = await db.all('SELECT id, actionPlan, tags, area, discipline, assignedTo, fromDate, toDate, duration, status, comment as notes FROM Actions ORDER BY fromDate DESC');
    res.json(actions);
  } catch (err) {
    console.error('Error fetching actions:', err);
    res.status(500).json({ error: 'Failed to fetch actions' });
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
  
  // Validate required fields
  if (!actionPlan || !area || !discipline || !fromDate || !toDate || !status) {
    console.error('Missing required fields:', { actionPlan, area, discipline, fromDate, toDate, status });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Use provided duration or calculate it
    const calculatedDuration = duration || Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));

    const result = await db.run(`
      INSERT INTO Actions (
        actionPlan, tags, area, discipline, assignedTo, 
        fromDate, toDate, duration, status, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      notes || ''
    ]);
    
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
      notes
    };
    
    console.log('Successfully added new action:', newAction);
    
    // Broadcast the new action to all connected clients
    broadcastUpdate({
      type: 'NEW_ACTION',
      action: newAction
    });
    
    res.status(201).json(newAction);
  } catch (err) {
    console.error('Error inserting action:', err);
    res.status(500).json({ error: err.message || 'Failed to add action' });
  }
});

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
  
  try {
    await db.run(`
      UPDATE Actions 
      SET actionPlan = ?,
          tags = ?,
          area = ?,
          discipline = ?,
          assignedTo = ?,
          fromDate = ?,
          toDate = ?,
          duration = ?,
          status = ?,
          comment = ?
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
      id
    ]);
    
    res.json({ id, ...req.body });
  } catch (err) {
    console.error('Error updating action:', err);
    res.status(500).json({ error: 'Failed to update action' });
  }
});

// Add DELETE endpoint
app.delete('/api/actions/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Attempting to delete action with ID:', id);
  
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
    
    if (result.changes === 0) {
      console.log('No action was deleted');
      return res.status(404).json({ error: 'Action not found' });
    }
    
    // Broadcast the deletion to all connected clients
    const deleteMessage = {
      type: 'DELETE_ACTION',
      id: parseInt(id)
    };
    console.log('Broadcasting delete message:', deleteMessage);
    broadcastUpdate(deleteMessage);
    
    res.json({ message: 'Action deleted successfully', id: parseInt(id) });
  } catch (err) {
    console.error('Error deleting action:', err);
    res.status(500).json({ error: 'Failed to delete action: ' + err.message });
  }
});

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
    process.exit(1);
  }
});