import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-2 mt-auto">
      <div className="max-w-full mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm space-y-1 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-green-400">Future is Mine</span>
            <span className="text-gray-300 hidden sm:inline">|</span>
            <span className="font-bold text-green-400">SBU Mining – OCP Group</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span className="text-gray-400 italic text-center sm:text-left">
              "We don't just extract value from the earth – we transform data into decisions"
            </span>
            <span className="text-gray-400">© 2025 OCP Group</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;