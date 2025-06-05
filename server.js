import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
    console.log('API: /api/reports called');
    console.log('Current working directory:', process.cwd());
    console.log('Reports folder path:', REPORTS_FOLDER);
    
    if (!fs.existsSync(REPORTS_FOLDER)) {
      console.error('Reports folder does not exist!');
      return res.status(500).json({ error: 'Reports folder not found' });
    }

    const files = fs.readdirSync(REPORTS_FOLDER);
    console.log('Files found in reports folder:', files);

    const reports = files
      .filter(file => {
        const isPdf = file.endsWith('.pdf');
        if (!isPdf) {
          console.log('Skipping non-PDF file:', file);
        }
        return isPdf;
      })
      .map(file => {
        const dateMatch = file.match(/\d{4}-\d{2}-\d{2}/);
        const date = dateMatch ? dateMatch[0] : '';
        const filePath = path.join(REPORTS_FOLDER, file);
        console.log('Processing file:', { file, date, filePath });
        return {
          id: file,
          date,
          fileName: file,
          filePath
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    console.log('Sending response with reports:', reports);
    res.json(reports);
  } catch (error) {
    console.error('Error in /api/reports:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to read reports', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Save a new report
app.post('/api/reports', (req, res) => {
  try {
    const { fileName, pdfData } = req.body;
    const filePath = path.join(REPORTS_FOLDER, fileName);
    console.log('Saving report to:', filePath);
    
    // Convert base64 to buffer and save
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
    fs.writeFileSync(filePath, pdfBuffer);

    res.json({ success: true, filePath });
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Reports folder location:', REPORTS_FOLDER);
}); 