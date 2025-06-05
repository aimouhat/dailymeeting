import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { useActions } from '../context/ActionContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getHistoricalReports, saveReport } from '../api/reports';

interface Report {
  id: string;
  date: string;
  fileName: string;
  filePath: string;
}

const REPORTS_FOLDER = 'Historical Reports';

const Reports: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { actions } = useActions();
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
        const reports = await getHistoricalReports();
        console.log('Loaded historical reports:', reports);
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
      console.log('Starting PDF generation...');
      const doc = new jsPDF();
      
      // Set white background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');

      // Function to load and convert image to base64
      const loadImageAsBase64 = async (imagePath: string): Promise<string> => {
        try {
          console.log('Loading image:', imagePath);
          const response = await fetch(imagePath);
          if (!response.ok) {
            throw new Error(`Failed to load image: ${response.statusText}`);
          }
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error(`Error loading image ${imagePath}:`, error);
          return '';
        }
      };

      // Load all three logos
      console.log('Loading logos...');
      const [logo1Base64, logo2Base64, logo3Base64] = await Promise.all([
        loadImageAsBase64('/1.png'),
        loadImageAsBase64('/2.png'),
        loadImageAsBase64('/3.png')
      ]);

      // Add logos if they were loaded successfully
      if (logo1Base64) doc.addImage(logo1Base64, 'PNG', 10, 15, 35, 18);
      if (logo2Base64) doc.addImage(logo2Base64, 'PNG', 87.5, 15, 35, 18);
      if (logo3Base64) doc.addImage(logo3Base64, 'PNG', 165, 15, 35, 18);

      // Add decorative line
      doc.setDrawColor(34, 197, 94); // Green color
      doc.setLineWidth(0.5);
      doc.line(20, 40, 190, 40);

      // Add title with modern styling
      doc.setFontSize(24);
      doc.setTextColor(34, 197, 94); // Green color
      doc.setFont('helvetica', 'bold');
      doc.text('Daily Meeting Report', 105, 55, { align: 'center' });

      // Add date with modern styling
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(today, 105, 65, { align: 'center' });

      const introText = [
        'Hello everyone,',
        '',
        'This document summarizes the key action items discussed during today\'s meeting.',
        'Your attention to these points and commitment to addressing them will contribute',
        'significantly to our continued progress and team success.',
        '',
        'Thank you for your collaboration.',
      ];

      let yPosition = 85;
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      introText.forEach(line => {
        if (line === '') {
          yPosition += 5;
        } else {
          doc.text(line, 25, yPosition, { maxWidth: 160 });
          yPosition += 8;
        }
      });

      // Add decorative line before table
      doc.setDrawColor(34, 197, 94); // Green color
      doc.line(20, yPosition + 5, 190, yPosition + 5);

      // Add actions table with modern styling
      const tableColumn = ['Action Plan', 'Area', 'Discipline', 'Assigned To', 'Status'];
      const tableRows = actions.map(action => [
        action.actionPlan,
        action.area,
        action.discipline,
        action.assignedTo || 'Not assigned',
        action.status,
      ]);

      console.log('Adding table with rows:', tableRows);
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPosition + 15,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [34, 197, 94], // Green color
          textColor: 60,
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [34, 197, 94], // Green color
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        margin: { left: 20, right: 20 },
      });

      // Add footer with page number
      const pageCount = (doc as any).internal.pages.length - 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      console.log('Generating PDF data...');
      const pdfData = doc.output('datauristring');
      console.log('Saving report...');
      await saveReport({ fileName, pdfData });
      console.log('Report saved successfully');
      doc.save(fileName);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      const today = new Date();
      const fileName = `Daily Meeting Report ${format(today, 'yyyy-MM-dd')}.pdf`;
      const filePath = `${REPORTS_FOLDER}/${fileName}`;

      const existingReportIndex = historicalReports.findIndex(report =>
        isSameDay(parseISO(report.date), today)
      );

      const success = await generatePDF(todayActions, fileName);

      if (success) {
        const newReport: Report = {
          id: fileName,
          date: format(today, 'yyyy-MM-dd'),
          fileName,
          filePath,
        };

        let updatedReports;
        if (existingReportIndex !== -1) {
          updatedReports = [...historicalReports];
          updatedReports[existingReportIndex] = newReport;
        } else {
          updatedReports = [newReport, ...historicalReports];
        }
        setHistoricalReports(updatedReports);
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
      const link = document.createElement('a');
      link.href = `http://localhost:3001/api/reports/${report.fileName}`;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
                <p className="text-gray-700">
                  <span className="font-medium">New Actions Today:</span> {todayActions.length}
                </p>
                <div className="h-32 overflow-y-auto border rounded-lg p-3 mt-2 bg-slate-100">
                  {todayActions.map((action, index) => (
                    <div key={index} className="text-sm text-gray-600 mb-2">
                      • {action.actionPlan}
                    </div>
                  ))}
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