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
import { PlusCircle, RotateCw } from 'lucide-react';
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
    lastUpdated
  } = useActions();
  
  const [uniqueAreas, setUniqueAreas] = useState<string[]>([]);
  const [showVideo, setShowVideo] = useState(true);
  const [transcribedText, setTranscribedText] = useState('');
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
        <div className="max-w-[95%] mx-auto px-4">
          <div className="flex justify-between items-center h-16">
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
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-200">
                  Integrated Exploratory Mines
                </h2>
                <p className="text-sm text-blue-200">Daily Actions Tracking System</p>
              </div>
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
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-6 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <NetworkInfo />
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="mb-6">
          <FilterBar 
            onFilter={filterActions} 
            areas={uniqueAreas}
          />
        </div>

        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-7">
            <StatusKPIs stats={statusStats} />
          </div>
          <div className="col-span-5">
            <div className="bg-white rounded-lg shadow-md h-full">
              <div className="flex items-center justify-between p-4 border-b">
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
              <div className="p-4 h-[calc(100%-4rem)]">
                {showVideo ? (
                  <div className="h-full">
                  <VideoPlayer folderPath="/videos" />
                  </div>
                ) : (
                  <div className="space-y-4 h-full">
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

        <div>
          <h2 className="text-xl font-bold mb-4">Action List</h2>
          <ActionTable actions={filteredActions} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;