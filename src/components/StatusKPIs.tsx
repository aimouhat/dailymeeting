import React from 'react';
import { StatusStats } from '../types/action';

interface StatusKPIsProps {
  stats: StatusStats[];
}

const StatusKPIs: React.FC<StatusKPIsProps> = ({ stats }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done':
        return 'bg-green-500';
      case 'In Progress':
        return 'bg-blue-500';
      case 'Delay':
        return 'bg-amber-500';
      case 'Not started':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const totalActions = stats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Action Status KPIs</h3>
        <div className="text-right">
          <div className="text-sm text-gray-600">Total Actions</div>
          <div className="text-2xl font-bold text-blue-600">{totalActions}</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.status} className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(stat.status)} mr-2`}></div>
              <span className="text-sm font-medium text-gray-600">{stat.status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              {stat.percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              {stat.count} actions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusKPIs; 