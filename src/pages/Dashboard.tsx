import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActions } from '../context/ActionContext';
import ActionTable from '../components/ActionTable';
import StatusKPIs from '../components/StatusKPIs';
import FilterBar from '../components/FilterBar';
import AudioRecorder from '../components/AudioRecorder';
import VideoPlayer from '../components/VideoPlayer';
import FloatingVideoPlayer from '../components/FloatingVideoPlayer';
import NetworkInfo from '../components/NetworkInfo';
import Footer from '../components/Footer';
import { PlusCircle, RotateCw, Menu, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Reports from '../components/Reports';

const Dashboard: React.FC = () => {
  const { 
    filteredActions, 
    isLoading, 
    error, 
    statusStats,
    actions,
    filterActions,
    lastUpdated,
    refreshData,
    currentFilters
  } = useActions();
  
  const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
  const [showVideo, setShowVideo] = useState(true);
  const [transcribedText, setTranscribedText] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentDate = format(new Date(), 'dd MMM yyyy');

  useEffect(() => {
    if (actions.length > 0) {
      const areas = [...new Set(actions.map(action => action.area))];
      setUniqueAreas(areas);
    }
  }, [actions]);

  const handleTranscriptionComplete = (text: string) => {
    setTranscribedText(text);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RotateCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FloatingVideoPlayer />
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white shadow-lg">
        <div className="max-w-full mx-auto px-2 sm:px-4">
          {/* Mobile Header */}
          <div className="flex justify-between items-center h-14 sm:h-16 lg:hidden">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {/* Logos */}
              <div className="flex items-center space-x-1">
                <img src="/1.png" alt="Future is Mine" className="h-5" />
                <img src="/2.png" alt="Integrated Exploratory Mines" className="h-5" />
                <img src="/3.png" alt="OCP SBU Mining" className="h-5" />
              </div>
              
              {/* Title and Date */}
              <div className="ml-2 min-w-0 flex-1">
                <h1 className="text-sm font-bold text-white truncate">Daily Meeting Manager</h1>
                <p className="text-xs text-blue-200">{currentDate}</p>
              </div>
            </div>

            {/* QR Code, Last Updated, and Refresh - Mobile */}
            <div className="flex items-center space-x-2 mr-2">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-1 text-blue-200 hover:text-white transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-xs text-blue-200 text-right">
                <div>Last update:</div>
                <div>{lastUpdated.toLocaleTimeString()}</div>
              </div>
              <NetworkInfo />
            </div>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md hover:bg-blue-800 flex-shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <img src="/1.png" alt="Future is Mine" className="h-10" />
                <div className="h-8 w-px bg-blue-700"></div>
                <img src="/2.png" alt="Integrated Exploratory Mines" className="h-10" />
                <div className="h-8 w-px bg-blue-700"></div>
                <img src="/3.png" alt="OCP SBU Mining" className="h-10" />
              </div>
              <div className="h-8 w-px bg-blue-700"></div>
              <div>
                <h1 className="text-xl font-bold tracking-wider">Daily Meeting Manager</h1>
                <p className="text-sm text-blue-200">{currentDate}</p>
              </div>
            </div>

            {/* QR Code, Last Updated, and Refresh - Desktop Center */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 text-blue-200 hover:text-white transition-colors rounded-md hover:bg-blue-800"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <div className="text-center">
                <div className="text-sm text-blue-200">Last updated:</div>
                <div className="text-sm font-medium text-white">{lastUpdated.toLocaleTimeString()}</div>
              </div>
              <div className="h-8 w-px bg-blue-700"></div>
              <NetworkInfo />
            </div>
            
            <div className="flex items-center space-x-4">
              <Reports />
              <Link 
                to="/form" 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Add Action
              </Link>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-blue-700 py-4 space-y-3">
              <div className="flex flex-col space-y-2">
                <Reports />
                <Link 
                  to="/form" 
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Add Action
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 flex-grow">

        {/* Mobile Layout - Stack vertically */}
        <div className="lg:hidden space-y-4 sm:space-y-6 mb-6 sm:mb-8">
          {/* Status KPIs - Full width on mobile */}
          <div className="w-full">
            <StatusKPIs stats={statusStats} />
          </div>
          
          {/* Video/Recording Section - Full width on mobile */}
          <div className="w-full">
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <h2 className="text-base sm:text-lg font-semibold">
                  {showVideo ? 'Meeting Video' : 'Voice Recording'}
                </h2>
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded"
                >
                  Switch to {showVideo ? 'Recording' : 'Video'}
                </button>
              </div>
              <div className="p-3 sm:p-4">
                {showVideo ? (
                  <div className="w-full">
                    <VideoPlayer folderPath="/videos" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                    {transcribedText && (
                      <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Transcribed Text:</h3>
                        <p className="text-sm text-gray-600">{transcribedText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout - Side by side with SAME HEIGHT */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 mb-8">
          {/* Status KPIs - Takes 7 columns */}
          <div className="col-span-7">
            <StatusKPIs stats={statusStats} />
          </div>
          
          {/* Video/Recording Section - Takes 5 columns with EXACT SAME HEIGHT */}
          <div className="col-span-5">
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <h2 className="text-lg font-semibold">
                  {showVideo ? 'Meeting Video' : 'Voice Recording'}
                </h2>
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Switch to {showVideo ? 'Recording' : 'Video'}
                </button>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-center">
                {showVideo ? (
                  <div className="h-full flex items-center justify-center">
                    <VideoPlayer folderPath="/videos" />
                  </div>
                ) : (
                  <div className="space-y-4 h-full flex flex-col justify-center">
                    <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
                    {transcribedText && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Transcribed Text:</h3>
                        <p className="text-gray-600">{transcribedText}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar - Full width */}
        <div className="mb-4 sm:mb-6">
          <FilterBar 
            onFilter={filterActions} 
            areas={uniqueAreas}
          />
        </div>

        {/* Action List - Full width */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Action List</h2>
            <div className="text-sm text-gray-600">
              Showing {filteredActions.length} of {actions.length} actions
              {currentFilters.status === 'auto-filter' && (
                <span className="ml-2 text-blue-600 font-medium">(Active Only)</span>
              )}
            </div>
          </div>
          <ActionTable actions={filteredActions} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;