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

  const generatePDF = async (actions: any[], fileName: string) => {
    try {
      console.log('Starting professional PDF generation...');
      const doc = new jsPDF();
      
      // Set white background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      // Add header section with company info
      doc.setFillColor(240, 248, 255); // Light blue background for header
      doc.rect(0, 0, 210, 60, 'F');

      // Add border
      doc.setDrawColor(59, 130, 246); // Blue border
      doc.setLineWidth(1);
      doc.rect(10, 10, 190, 277);

      // Company logos as text (professional layout)
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246); // Blue color
      doc.setFont('helvetica', 'bold');
      doc.text('FUTURE IS MINE', 20, 25);
      doc.text('|', 75, 25);
      doc.text('INTEGRATED EXPLORATORY MINES', 85, 25);
      doc.text('|', 175, 25);
      doc.text('OCP GROUP', 20, 35);

      // Main title
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0); // Black
      doc.setFont('helvetica', 'bold');
      doc.text('DAILY MEETING REPORT', 105, 50, { align: 'center' });

      // Date
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100); // Gray
      doc.setFont('helvetica', 'normal');
      doc.text(format(new Date(), 'EEEE, MMMM do, yyyy'), 105, 65, { align: 'center' });

      let yPosition = 80;

      // Summary Statistics Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY STATISTICS', 20, yPosition);
      yPosition += 10;

      // Draw summary table
      const summaryData = [
        ['Total Actions', actions.length.toString()],
        ['Today\'s Actions', todayActions.length.toString()],
        ['Completed', statusStats.find(s => s.status === 'Done')?.count.toString() || '0'],
        ['In Progress', statusStats.find(s => s.status === 'In Progress')?.count.toString() || '0'],
        ['Delayed', statusStats.find(s => s.status === 'Delay')?.count.toString() || '0'],
        ['Not Started', statusStats.find(s => s.status === 'Not started')?.count.toString() || '0']
      ];

      autoTable(doc, {
        body: summaryData,
        startY: yPosition,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineWidth: 0.5,
          lineColor: [200, 200, 200]
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 },
          1: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: 20, right: 20 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Today's Actions Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`TODAY'S ACTIONS (${todayActions.length} items)`, 20, yPosition);
      yPosition += 10;

      if (todayActions.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'italic');
        doc.text('No actions scheduled for today', 20, yPosition);
      } else {
        // Create table for today's actions
        const tableColumns = ['Action Plan', 'Area', 'Discipline', 'Assigned To', 'From', 'To', 'Status'];
        const tableRows = todayActions.map(action => [
          action.actionPlan,
          action.area,
          action.discipline,
          action.assignedTo || 'Unassigned',
          format(new Date(action.fromDate), 'dd/MM/yyyy'),
          format(new Date(action.toDate), 'dd/MM/yyyy'),
          action.status
        ]);

        autoTable(doc, {
          head: [tableColumns],
          body: tableRows,
          startY: yPosition,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [0, 0, 0],
            lineWidth: 0.5,
            lineColor: [200, 200, 200],
            overflow: 'linebreak',
            cellWidth: 'wrap'
          },
          headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          columnStyles: {
            0: { cellWidth: 50 }, // Action Plan
            1: { cellWidth: 25 }, // Area
            2: { cellWidth: 25 }, // Discipline
            3: { cellWidth: 30 }, // Assigned To
            4: { cellWidth: 20 }, // From
            5: { cellWidth: 20 }, // To
            6: { cellWidth: 20 }  // Status
          },
          margin: { left: 20, right: 20 },
          pageBreak: 'auto',
          showHead: 'everyPage'
        });
      }

      // Add footer to all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, 280, 190, 280);
        
        // Footer text
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 285);
        doc.text('Daily Meeting Manager - OCP Group', 105, 285, { align: 'center' });
        doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
      }

      // Save the PDF
      const pdfData = doc.output('datauristring');
      await mockDataService.saveReport({ fileName, pdfData });
      doc.save(fileName);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
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
        alert('PDF report generated successfully!');
      } else {
        alert('Failed to generate PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error in generateReport:', error);
      alert('An error occurred while generating the report.');
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