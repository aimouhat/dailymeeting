import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import { Action } from '../types/action';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ActionTimelineProps {
  actions: Action[];
}

const ActionTimeline: React.FC<ActionTimelineProps> = ({ actions }) => {
  const statusColors = {
    'Done': '#10B981',
    'In Progress': '#3B82F6',
    'Delay': '#F59E0B',
    'Not started': '#EF4444'
  };

  const sortedActions = [...actions].sort((a, b) => 
    parseISO(a.fromDate).getTime() - parseISO(b.fromDate).getTime()
  );

  const data = {
    labels: sortedActions.map(action => format(parseISO(action.fromDate), 'dd/MM/yyyy')),
    datasets: Object.entries(statusColors).map(([status, color]) => ({
      label: status,
      data: sortedActions.map(action => 
        action.status === status ? 1 : 0
      ),
      borderColor: color,
      backgroundColor: color,
      tension: 0.4,
      pointRadius: 6,
      pointHoverRadius: 8,
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const actionIndex = context[0].dataIndex;
            const action = sortedActions[actionIndex];
            return `${action.actionPlan}\n${format(parseISO(action.fromDate), 'dd/MM/yyyy')}`;
          },
          label: (context: any) => {
            const actionIndex = context.dataIndex;
            const action = sortedActions[actionIndex];
            return [
              `Status: ${action.status}`,
              `Area: ${action.area}`,
              `Assigned To: ${action.assignedTo || 'Not assigned'}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.5,
        ticks: {
          stepSize: 1,
          display: false
        },
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    }
  };

  return (
    <div className="h-[300px]">
      <Line data={data} options={options} />
    </div>
  );
};

export default ActionTimeline;