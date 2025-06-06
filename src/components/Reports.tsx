import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
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
        setError('Failed to load historical reports. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadHistoricalReports();
  }, []);

  const generatePDF = async (actions: any[], fileName: string) => {
    try {
      console.log('Starting futuristic PDF generation...');
      const doc = new jsPDF();
      
      // Set dark background for futuristic look
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 297, 'F');

      // Function to load and convert image to base64
      const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
        try {
          const response = await fetch(imagePath);
          if (!response.ok) {
            console.warn(`Failed to load image: ${imagePath}`);
            return '';
          }
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => {
              console.warn(`Error reading image: ${imagePath}`);
              resolve('');
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.warn(`Error loading image ${imagePath}:`, error);
          return '';
        }
      };

      // Load all three logos with error handling
      const [logo1Base64, logo2Base64, logo3Base64] = await Promise.all([
        loadImageAsBase64('/1.png'),
        loadImageAsBase64('/2.png'),
        loadImageAsBase64('/3.png')
      ]);

      // Add futuristic header background
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, 210, 50, 'F');

      // Add glowing border effect
      doc.setDrawColor(34, 197, 94); // emerald-500
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);

      // Add secondary border for depth
      doc.setDrawColor(59, 130, 246); // blue-500
      doc.setLineWidth(0.5);
      doc.rect(8, 8, 194, 281);

      // Add logos with better positioning and error handling
      try {
        if (logo1Base64) doc.addImage(logo1Base64, 'PNG', 15, 12, 30, 16);
        if (logo2Base64) doc.addImage(logo2Base64, 'PNG', 90, 12, 30, 16);
        if (logo3Base64) doc.addImage(logo3Base64, 'PNG', 165, 12, 30, 16);
      } catch (imageError) {
        console.warn('Error adding images to PDF:', imageError);
      }

      // Add futuristic title with gradient effect simulation
      doc.setFontSize(28);
      doc.setTextColor(34, 197, 94); // emerald-500
      doc.setFont('helvetica', 'bold');
      doc.text('DAILY MEETING REPORT', 105, 65, { align: 'center' });

      // Add subtitle with neon effect
      doc.setFontSize(14);
      doc.setTextColor(59, 130, 246); // blue-500
      doc.setFont('helvetica', 'normal');
      doc.text('INTEGRATED EXPLORATORY MINES', 105, 75, { align: 'center' });

      // Add date with modern styling
      doc.setFontSize(12);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(format(new Date(), 'dddd, MMMM Do, YYYY'), 105, 85, { align: 'center' });

      // Add decorative line with gradient effect
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(2);
      doc.line(30, 95, 180, 95);

      // Add KPIs Section with futuristic design
      let yPosition = 110;
      
      // KPIs Header with background
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(20, yPosition - 5, 170, 20, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.rect(20, yPosition - 5, 170, 20);

      doc.setFontSize(16);
      doc.setTextColor(34, 197, 94);
      doc.setFont('helvetica', 'bold');
      doc.text('ACTION STATUS ANALYTICS', 105, yPosition + 5, { align: 'center' });
      yPosition += 30;

      // Total Actions with futuristic card design
      doc.setFillColor(51, 65, 85); // slate-700
      doc.rect(70, yPosition - 5, 70, 25, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(1);
      doc.rect(70, yPosition - 5, 70, 25);

      doc.setFontSize(12);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL ACTIONS', 105, yPosition + 3, { align: 'center' });
      
      doc.setFontSize(24);
      doc.setTextColor(34, 197, 94);
      doc.text(actions.length.toString(), 105, yPosition + 15, { align: 'center' });
      yPosition += 40;

      // Ensure all 4 status types are shown
      const allStatusTypes = ['Not started', 'In Progress', 'Delay', 'Done'];
      const statusColors = {
        'Done': [16, 185, 129], // emerald-500
        'In Progress': [59, 130, 246], // blue-500
        'Delay': [245, 158, 11], // amber-500
        'Not started': [239, 68, 68] // red-500
      };

      const completeStatusStats = allStatusTypes.map(status => {
        const existingStat = statusStats.find(s => s.status === status);
        return existingStat || {
          status,
          count: 0,
          percentage: 0,
          color: `rgb(${statusColors[status as keyof typeof statusColors].join(',')})`
        };
      });

      // KPI Cards in a futuristic grid
      const cardWidth = 40;
      const cardHeight = 35;
      const startX = 25;
      const cardSpacing = 5;

      completeStatusStats.forEach((stat, index) => {
        const cardX = startX + (index * (cardWidth + cardSpacing));
        
        // Card background with gradient effect
        doc.setFillColor(51, 65, 85); // slate-700
        doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F');
        
        // Card border with status color
        const statusColor = statusColors[stat.status as keyof typeof statusColors];
        doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setLineWidth(1.5);
        doc.rect(cardX, yPosition, cardWidth, cardHeight);
        
        // Status indicator bar
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.rect(cardX, yPosition, cardWidth, 3, 'F');
        
        // Status name
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225); // slate-300
        doc.setFont('helvetica', 'bold');
        doc.text(stat.status.toUpperCase(), cardX + cardWidth/2, yPosition + 12, { align: 'center' });
        
        // Percentage with glow effect
        doc.setFontSize(16);
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${stat.percentage.toFixed(1)}%`, cardX + cardWidth/2, yPosition + 22, { align: 'center' });
        
        // Count
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont('helvetica', 'normal');
        doc.text(`${stat.count} ACTIONS`, cardX + cardWidth/2, yPosition + 30, { align: 'center' });
      });

      yPosition += cardHeight + 25;

      // Filter actions for today
      const todayActionsForReport = actions.filter(action => {
        const actionDate = new Date(action.fromDate);
        const today = new Date();
        return actionDate.toDateString() === today.toDateString();
      });

      // Today's Actions Header with futuristic design
      doc.setFillColor(30, 41, 59);
      doc.rect(20, yPosition - 5, 170, 18, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.rect(20, yPosition - 5, 170, 18);

      doc.setFontSize(14);
      doc.setTextColor(34, 197, 94);
      doc.setFont('helvetica', 'bold');
      doc.text(`TODAY'S MISSION BRIEFING (${todayActionsForReport.length} ACTIONS)`, 105, yPosition + 5, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(59, 130, 246);
      doc.text(format(new Date(), 'dddd, MMMM Do, YYYY').toUpperCase(), 105, yPosition + 12, { align: 'center' });
      yPosition += 25;

      if (todayActionsForReport.length === 0) {
        // No actions message with futuristic styling
        doc.setFillColor(51, 65, 85);
        doc.rect(40, yPosition, 130, 30, 'F');
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(1);
        doc.rect(40, yPosition, 130, 30);

        doc.setFontSize(14);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text('NO ACTIVE MISSIONS TODAY', 105, yPosition + 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text('ALL SYSTEMS OPERATIONAL', 105, yPosition + 22, { align: 'center' });
      } else {
        // Add actions table with futuristic styling
        const tableColumn = ['ACTION PLAN', 'TAGS', 'ASSIGNED TO', 'FROM', 'TO'];
        const tableRows = todayActionsForReport.map(action => [
          action.actionPlan || '',
          action.tags || '-',
          action.assignedTo || 'UNASSIGNED',
          format(new Date(action.fromDate), 'dd/MM/yyyy'),
          format(new Date(action.toDate), 'dd/MM/yyyy'),
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: yPosition,
          theme: 'plain',
          styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [203, 213, 225], // slate-300
            lineWidth: 0.5,
            lineColor: [59, 130, 246], // blue-500
            overflow: 'linebreak',
            cellWidth: 'wrap',
            valign: 'top',
            fillColor: [51, 65, 85] // slate-700
          },
          headStyles: {
            fillColor: [30, 41, 59], // slate-800
            textColor: [34, 197, 94], // emerald-500
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
            lineWidth: 1,
            lineColor: [34, 197, 94]
          },
          alternateRowStyles: {
            fillColor: [45, 55, 72], // slate-600
          },
          columnStyles: {
            0: { cellWidth: 80, halign: 'left' }, // Action Plan
            1: { cellWidth: 25, halign: 'center' }, // Tags
            2: { cellWidth: 40, halign: 'center' }, // Assigned To
            3: { cellWidth: 22, halign: 'center' }, // From Date
            4: { cellWidth: 22, halign: 'center' }, // To Date
          },
          margin: { left: 15, right: 15 },
          pageBreak: 'auto',
          showHead: 'everyPage',
          tableWidth: 'auto',
          didParseCell: function(data) {
            if (data.column.index === 0) {
              data.cell.styles.minCellHeight = 12;
            }
          },
          didDrawPage: function(data) {
            // Add page background for continuation pages
            if (data.pageNumber > 1) {
              doc.setFillColor(15, 23, 42);
              doc.rect(0, 0, 210, 297, 'F');
              
              // Add borders on continuation pages
              doc.setDrawColor(34, 197, 94);
              doc.setLineWidth(1);
              doc.rect(5, 5, 200, 287);
              doc.setDrawColor(59, 130, 246);
              doc.setLineWidth(0.5);
              doc.rect(8, 8, 194, 281);
            }
          }
        });
      }

      // Add futuristic footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer background
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 280, 210, 17, 'F');
        
        // Footer border
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.line(10, 280, 200, 280);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(`GENERATED: ${format(new Date(), 'dd/MM/yyyy HH:mm')} UTC`, 15, 290);
        doc.text(`CLASSIFICATION: INTERNAL`, 105, 290, { align: 'center' });
        doc.text(`PAGE ${i} OF ${pageCount}`, 195, 290, { align: 'right' });
        
        // Add system status indicator
        doc.setFillColor(34, 197, 94);
        doc.circle(200, 285, 1, 'F');
        doc.setFontSize(6);
        doc.setTextColor(34, 197, 94);
        doc.text('ONLINE', 195, 285, { align: 'right' });
      }

      // Save the PDF and handle the data
      try {
        const pdfData = doc.output('datauristring');
        await mockDataService.saveReport({ fileName, pdfData });
        doc.save(fileName);
        return true;
      } catch (saveError) {
        console.error('Error saving PDF:', saveError);
        // Still try to download even if save fails
        doc.save(fileName);
        return true;
      }
    } catch (error) {
      console.error('Error generating futuristic PDF:', error);
      throw error;
    }
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const today = new Date();
      const fileName = `Daily Meeting Report ${format(today, 'yyyy-MM-dd')}.pdf`;

      const existingReportIndex = historicalReports.findIndex(report =>
        isSameDay(parseISO(report.date), today)
      );

      const success = await generatePDF(actions, fileName);

      if (success) {
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
      }
    } catch (error) {
      console.error('Error in generateReport:', error);
      setError('Failed to generate PDF. Please try again.');
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
                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <button
                  onClick={generateReport}
                  disabled={isGenerating}
                  className={`w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 hover:from-green-600 hover:to-green-700 transition-all duration-200 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Download className="w-5 h-5" />
                  <span>{isGenerating ? 'Generating...' : 'Generate Daily Meeting Report'}</span>
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Historical Reports</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading reports...</span>
                    </div>
                  ) : error ? (
                    <div className="text-sm text-red-500 text-center py-4">{error}</div>
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