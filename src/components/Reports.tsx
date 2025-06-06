import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, ExternalLink } from 'lucide-react';
import { useActions } from '../context/ActionContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { mockDataService } from '../services/mockDataService';

interface Report {
  id: string;
  date: string;
  fileName: string;
  filePath: string;
}

const Reports: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { actions, statusStats } = useActions();
  const [historicalReports, setHistoricalReports] = useState<Report[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const todayActions = actions.filter(action => {
    const actionDate = new Date(action.fromDate);
    return actionDate.toDateString() === new Date().toDateString();
  });

  useEffect(() => {
    const loadHistoricalReports = async () => {
      try {
        setIsLoading(true);
        const reports = await mockDataService.getAllReports();
        setHistoricalReports(reports);
      } catch (error) {
        console.error('Error loading historical reports:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistoricalReports();
  }, []);

  const generatePrintFriendlyHTML = (actions: any[], fileName: string): string => {
    // Filter actions for today
    const todayActionsForReport = actions.filter(action => {
      const actionDate = new Date(action.fromDate);
      const today = new Date();
      return actionDate.toDateString() === today.toDateString();
    });

    // Ensure all 4 status types are shown
    const allStatusTypes = ['Not started', 'In Progress', 'Delay', 'Done'];
    const statusColors = {
      'Done': '#10B981',
      'In Progress': '#3B82F6', 
      'Delay': '#F59E0B',
      'Not started': '#EF4444'
    };

    const completeStatusStats = allStatusTypes.map(status => {
      const existingStat = statusStats.find(s => s.status === status);
      return existingStat || {
        status,
        count: 0,
        percentage: 0,
        color: statusColors[status as keyof typeof statusColors]
      };
    });

    const totalActions = actions.length;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Meeting Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: white !important;
            color: #333 !important;
            line-height: 1.6;
            padding: 20px;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white !important;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            border: 2px solid #e2e8f0;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
            color: white !important;
            padding: 30px;
            text-align: center;
            position: relative;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .logos {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }
        
        .logo {
            background: rgba(255,255,255,0.1) !important;
            padding: 10px 20px;
            border-radius: 10px;
            border: 2px solid rgba(255,255,255,0.2) !important;
            font-weight: bold;
            font-size: 12px;
            letter-spacing: 1px;
            color: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .title {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            position: relative;
            z-index: 2;
            color: white !important;
        }
        
        .subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin-bottom: 5px;
            position: relative;
            z-index: 2;
            color: white !important;
        }
        
        .date {
            font-size: 1em;
            opacity: 0.8;
            position: relative;
            z-index: 2;
            color: white !important;
        }
        
        .content {
            padding: 40px;
            background: white !important;
        }
        
        .kpi-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 1.8em;
            font-weight: bold;
            color: #1e3c72 !important;
            margin-bottom: 20px;
            text-align: center;
            position: relative;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2) !important;
            border-radius: 2px;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .kpi-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            border: 2px solid #e2e8f0 !important;
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--status-color) !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .kpi-card.total {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
            color: white !important;
            grid-column: span 2;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .kpi-card.total::before {
            background: #10B981 !important;
        }
        
        .kpi-label {
            font-size: 0.9em;
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.8;
        }
        
        .kpi-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .kpi-percentage {
            font-size: 1.1em;
            font-weight: 600;
            opacity: 0.9;
        }
        
        .actions-section {
            margin-top: 40px;
        }
        
        .actions-header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
            color: white !important;
            padding: 20px;
            border-radius: 15px 15px 0 0;
            text-align: center;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .actions-count {
            font-size: 1.2em;
            margin-top: 5px;
            opacity: 0.9;
            color: white !important;
        }
        
        .actions-table {
            width: 100%;
            border-collapse: collapse;
            background: white !important;
            border-radius: 0 0 15px 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .actions-table th {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
            padding: 15px 10px;
            text-align: left;
            font-weight: bold;
            color: #1e3c72 !important;
            border-bottom: 2px solid #e2e8f0 !important;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .actions-table td {
            padding: 15px 10px;
            border-bottom: 1px solid #f1f5f9 !important;
            vertical-align: top;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .actions-table tr:nth-child(even) {
            background: #f8fafc !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .action-plan {
            font-weight: 600;
            color: #1e3c72 !important;
            max-width: 300px;
            word-wrap: break-word;
            line-height: 1.4;
        }
        
        .tag {
            background: #e2e8f0 !important;
            color: #64748b !important;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: 500;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .assigned-to {
            font-weight: 500;
            color: #475569 !important;
        }
        
        .date-cell {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #64748b !important;
        }
        
        .no-actions {
            text-align: center;
            padding: 40px;
            color: #64748b !important;
            font-style: italic;
            background: #f8fafc !important;
            border-radius: 0 0 15px 15px;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .footer {
            background: #1e3c72 !important;
            color: white !important;
            padding: 20px;
            text-align: center;
            font-size: 0.9em;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .footer-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 5px;
            background: #10B981 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10B981 !important;
            color: white !important;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        
        .print-button:hover {
            background: #059669 !important;
        }
        
        @media print {
            body {
                background: white !important;
                padding: 0;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
                border: none;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .kpi-grid {
                grid-template-columns: repeat(4, 1fr);
                page-break-inside: avoid;
            }
            
            .kpi-card {
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .kpi-card.total {
                grid-column: span 4;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .actions-table th {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
                color: #1e3c72 !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .actions-table tr:nth-child(even) {
                background: #f8fafc !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .actions-header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%) !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .footer {
                background: #1e3c72 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            .print-button {
                display: none;
            }
            
            .actions-section {
                page-break-inside: avoid;
            }
            
            .actions-table {
                page-break-inside: auto;
            }
            
            .actions-table tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Print to PDF</button>
    
    <div class="container">
        <div class="header">
            <div class="logos">
                <div class="logo">FUTURE IS MINE</div>
                <div class="logo">INTEGRATED EXPLORATORY MINES</div>
                <div class="logo">OCP GROUP</div>
            </div>
            <div class="title">DAILY MEETING REPORT</div>
            <div class="subtitle">Mining Operations Dashboard</div>
            <div class="date">${format(new Date(), 'EEEE, MMMM do, yyyy')}</div>
        </div>
        
        <div class="content">
            <div class="kpi-section">
                <h2 class="section-title">Action Status Analytics</h2>
                <div class="kpi-grid">
                    <div class="kpi-card total">
                        <div class="kpi-label">Total Actions</div>
                        <div class="kpi-value">${totalActions}</div>
                        <div class="kpi-percentage">All Operations</div>
                    </div>
                    ${completeStatusStats.map(stat => `
                        <div class="kpi-card" style="--status-color: ${stat.color}">
                            <div class="kpi-label">${stat.status}</div>
                            <div class="kpi-value" style="color: ${stat.color} !important">${stat.count}</div>
                            <div class="kpi-percentage">${stat.percentage.toFixed(1)}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="actions-section">
                <div class="actions-header">
                    <h2>Today's Mission Briefing</h2>
                    <div class="actions-count">${todayActionsForReport.length} Active Actions</div>
                </div>
                
                ${todayActionsForReport.length > 0 ? `
                    <table class="actions-table">
                        <thead>
                            <tr>
                                <th style="width: 40%">Action Plan</th>
                                <th style="width: 10%">Tags</th>
                                <th style="width: 20%">Assigned To</th>
                                <th style="width: 15%">From Date</th>
                                <th style="width: 15%">To Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${todayActionsForReport.map(action => `
                                <tr>
                                    <td class="action-plan">${action.actionPlan}</td>
                                    <td>${action.tags ? `<span class="tag">${action.tags}</span>` : '-'}</td>
                                    <td class="assigned-to">${action.assignedTo || 'UNASSIGNED'}</td>
                                    <td class="date-cell">${format(new Date(action.fromDate), 'dd/MM/yyyy')}</td>
                                    <td class="date-cell">${format(new Date(action.toDate), 'dd/MM/yyyy')}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div class="no-actions">
                        <h3>No Active Missions Today</h3>
                        <p>All systems operational - No scheduled actions for today</p>
                    </div>
                `}
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-info">
                <div>Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')} UTC</div>
                <div>Classification: INTERNAL</div>
                <div><span class="status-indicator"></span>System Online</div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-print instructions
        setTimeout(() => {
            const printInstructions = document.createElement('div');
            printInstructions.style.cssText = \`
                position: fixed;
                top: 70px;
                right: 20px;
                background: #1e3c72;
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-size: 12px;
                z-index: 1001;
                max-width: 250px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            \`;
            printInstructions.innerHTML = \`
                <strong>📄 To save as PDF:</strong><br>
                1. Press Ctrl+P (or Cmd+P on Mac)<br>
                2. Select "Save as PDF" as destination<br>
                3. Choose "More settings" → "Background graphics"<br>
                4. Click Save<br><br>
                <small>This ensures colors and styling are preserved!</small>
            \`;
            document.body.appendChild(printInstructions);
            
            // Remove instructions after 10 seconds
            setTimeout(() => {
                if (printInstructions.parentNode) {
                    printInstructions.parentNode.removeChild(printInstructions);
                }
            }, 10000);
        }, 1000);
    </script>
</body>
</html>`;
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      const today = new Date();
      const fileName = `Daily Meeting Report ${format(today, 'yyyy-MM-dd')}.html`;

      const existingReportIndex = historicalReports.findIndex(report =>
        isSameDay(parseISO(report.date), today)
      );

      // Generate HTML content with print-friendly styling
      const htmlContent = generatePrintFriendlyHTML(actions, fileName);
      setReportContent(htmlContent);
      
      // Create blob and download link
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Also try to open in new window
      try {
        const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
        }
      } catch (popupError) {
        console.log('Popup blocked, but file was downloaded');
        setShowReportPreview(true);
      }

      // Save to mock service
      const pdfData = 'data:text/html;base64,' + btoa(htmlContent);
      await mockDataService.saveReport({ fileName, pdfData });

      const newReport: Report = {
        id: fileName,
        date: format(today, 'yyyy-MM-dd'),
        fileName,
        filePath: `Historical Reports/${fileName}`,
      };

      let updatedReports;
      if (existingReportIndex !== -1) {
        updatedReports = [...historicalReports];
        updatedReports[existingReportIndex] = newReport;
      } else {
        updatedReports = [newReport, ...historicalReports];
      }
      setHistoricalReports(updatedReports);
      
    } catch (error) {
      console.error('Error in generateReport:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: Report) => {
    try {
      // Since we're using static data, we'll just show a message
      alert(`In a real application, this would download: ${report.fileName}`);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download the report. Please try again.');
    }
  };

  const openReportPreview = () => {
    if (reportContent) {
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
      if (printWindow) {
        printWindow.document.write(reportContent);
        printWindow.document.close();
        printWindow.focus();
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-5 rounded-xl flex items-center transition-all duration-300 shadow-md hover:shadow-xl"
      >
        <Download className="w-5 h-5 mr-2" />
        Reports
        {isOpen ? <ChevronUp className="ml-2" /> : <ChevronDown className="ml-2" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[500px] bg-white rounded-xl shadow-2xl z-50">
          <div className="p-6 bg-slate-50 rounded-xl">
            <div className="space-y-5">
              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Generate New Report</h3>
                <p className="text-gray-500 mb-3">{today}</p>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-gray-700">
                      <span className="font-medium">Total Actions:</span> {actions.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <span className="font-medium">Today's Actions:</span> {todayActions.length}
                    </p>
                  </div>
                </div>
                <div className="h-32 overflow-y-auto border rounded-lg p-3 mt-2 bg-slate-100">
                  {todayActions.length > 0 ? (
                    todayActions.map((action, index) => (
                      <div key={index} className="text-sm text-gray-600 mb-2">
                        • {action.actionPlan}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic text-center py-4">
                      No actions scheduled for today
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={generateReport}
                    disabled={isGenerating}
                    className={`flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Download className="w-5 h-5" />
                    <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
                  </button>
                  
                  {reportContent && (
                    <button
                      onClick={openReportPreview}
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center space-x-2 transition-all duration-200"
                      title="Open last generated report"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Historical Reports</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading reports...</span>
                    </div>
                  ) : historicalReports.length > 0 ? (
                    historicalReports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">{report.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(report.date), 'MMMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => downloadReport(report)}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No historical reports found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;