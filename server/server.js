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
  perMessageDeflate: false,
  maxPayload: 1024 * 1024
});

// Store connected clients with their IP addresses
const clients = new Map();

// Cleanup function for disconnected clients
const cleanupClient = (clientIp) => {
  const ws = clients.get(clientIp);
  if (ws) {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.close();
      }
    } catch (error) {
      console.error('Error closing connection for client', clientIp, ':', error);
    }
    clients.delete(clientIp);
  }
};

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress || 'unknown';
  console.log('New WebSocket connection from:', clientIp);

  // Check if client already has a connection
  if (clients.has(clientIp)) {
    console.log('Client already connected, cleaning up old connection');
    cleanupClient(clientIp);
  }

  // Store the new connection
  clients.set(clientIp, ws);
  
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
    if (ws.readyState === ws.OPEN) {
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
  console.log('Broadcasting to', clients.size, 'clients:', data.type);
  
  clients.forEach((ws, clientIp) => {
    if (ws.readyState === ws.OPEN) {
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
    console.log('Initializing SQLite database...');
    
    // Ensure the database directory exists
    const dbDir = path.dirname(path.join(__dirname, 'daily_meeting.db'));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Open database connection
    db = await open({
      filename: path.join(__dirname, 'daily_meeting.db'),
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');

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

// Create the reports folder in the project root
const REPORTS_FOLDER = path.join(process.cwd(), 'Historical Reports');

// Ensure the reports folder exists
if (!fs.existsSync(REPORTS_FOLDER)) {
  console.log('Creating reports folder at:', REPORTS_FOLDER);
  fs.mkdirSync(REPORTS_FOLDER, { recursive: true });
}

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
        return {
          id: file,
          date,
          fileName: file,
          filePath
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    }
  });
});

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
  
  // Validate required fields
  if (!actionPlan || !area || !discipline || !fromDate || !toDate || !status) {
    console.error('Missing required fields:', { actionPlan, area, discipline, fromDate, toDate, status });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
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
  
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  try {
    const result = await db.run(`
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
  }
});

// Add DELETE endpoint
app.delete('/api/actions/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Attempting to delete action with ID:', id);
  
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

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
    process.exit(1);
  }
});