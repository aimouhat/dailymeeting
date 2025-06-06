import React, { createContext, useState, useEffect, useContext } from 'react';
import { Action, AreaStats, StatusStats } from '../types/action';
import { mockDataService } from '../services/mockDataService';

interface ActionContextType {
  actions: Action[];
  isLoading: boolean;
  error: string | null;
  areaStats: AreaStats[];
  statusStats: StatusStats[];
  addAction: (action: Omit<Action, 'id'>) => Promise<void>;
  updateAction: (id: number, action: Partial<Action>) => Promise<void>;
  deleteAction: (id: number) => Promise<void>;
  filterActions: (filters: {
    dateRange?: { start: Date | null; end: Date | null };
    searchTerm?: string;
    status?: string;
    area?: string;
  }) => void;
  filteredActions: Action[];
  lastUpdated: Date;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const ActionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [actions, setActions] = useState<Action[]>([]);
  const [filteredActions, setFilteredActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areaStats, setAreaStats] = useState<AreaStats[]>([]);
  const [statusStats, setStatusStats] = useState<StatusStats[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Load initial data
  useEffect(() => {
    const loadActions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await mockDataService.getAllActions();
        setActions(data);
        
        // Apply auto-filter by default (exclude "Done" actions)
        const autoFiltered = data.filter(action => action.status !== 'Done');
        setFilteredActions(autoFiltered);
        
        calculateStats(data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error loading actions:', err);
        setError('Failed to load actions');
      } finally {
        setIsLoading(false);
      }
    };

    loadActions();

    // Set up periodic refresh to check for overdue actions
    const refreshInterval = setInterval(loadActions, 60000); // Check every minute

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // Set up mock WebSocket event handlers
  useEffect(() => {
    mockDataService.onActionAdded = (action: Action) => {
      setActions(prev => {
        const newActions = [...prev, action];
        calculateStats(newActions);
        return newActions;
      });
      
      // Only add to filtered actions if it's not "Done" (for auto-filter)
      setFilteredActions(prev => {
        // Check if we're currently auto-filtering (if filtered actions don't include "Done" actions)
        const hasCompletedActions = prev.some(a => a.status === 'Done');
        if (!hasCompletedActions && action.status !== 'Done') {
          return [...prev, action];
        } else if (hasCompletedActions) {
          return [...prev, action];
        }
        return prev;
      });
      
      setLastUpdated(new Date());
    };

    mockDataService.onActionUpdated = (action: Action) => {
      setActions(prev => {
        const updatedActions = prev.map(a => a.id === action.id ? action : a);
        calculateStats(updatedActions);
        return updatedActions;
      });
      setFilteredActions(prev => prev.map(a => a.id === action.id ? action : a));
      setLastUpdated(new Date());
    };

    mockDataService.onActionDeleted = (id: number) => {
      setActions(prev => {
        const updatedActions = prev.filter(a => a.id !== id);
        calculateStats(updatedActions);
        return updatedActions;
      });
      setFilteredActions(prev => prev.filter(a => a.id !== id));
      setLastUpdated(new Date());
    };

    return () => {
      mockDataService.onActionAdded = undefined;
      mockDataService.onActionUpdated = undefined;
      mockDataService.onActionDeleted = undefined;
    };
  }, []);

  const calculateStats = (actions: Action[]) => {
    // Calculate area stats
    const areaCounts = actions.reduce((acc, action) => {
      acc[action.area] = (acc[action.area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const areaStats = Object.entries(areaCounts).map(([area, count]) => ({
      area,
      count,
      percentage: (count / actions.length) * 100
    }));

    // Calculate status stats with colors
    const statusColors = {
      'Done': '#10B981',
      'In Progress': '#3B82F6',
      'Delay': '#F59E0B',
      'Not started': '#EF4444'
    };

    const statusCounts = actions.reduce((acc, action) => {
      acc[action.status] = (acc[action.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusStats = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: (count / actions.length) * 100,
      color: statusColors[status as keyof typeof statusColors] || '#6B7280'
    }));

    setAreaStats(areaStats);
    setStatusStats(statusStats);
  };

  const addAction = async (action: Omit<Action, 'id'>) => {
    try {
      const newAction = await mockDataService.addAction(action);
      setActions(prev => {
        const updatedActions = [...prev, newAction];
        calculateStats(updatedActions);
        return updatedActions;
      });
      
      // Only add to filtered actions if it matches current filter
      setFilteredActions(prev => {
        const hasCompletedActions = prev.some(a => a.status === 'Done');
        if (!hasCompletedActions && newAction.status !== 'Done') {
          return [...prev, newAction];
        } else if (hasCompletedActions) {
          return [...prev, newAction];
        }
        return prev;
      });
      
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error adding action:', err);
      throw err;
    }
  };

  const updateAction = async (id: number, updates: Partial<Action>) => {
    try {
      const updatedAction = await mockDataService.updateAction(id, updates);
      setActions(prev => {
        const updatedActions = prev.map(a => a.id === id ? updatedAction : a);
        calculateStats(updatedActions);
        return updatedActions;
      });
      setFilteredActions(prev => prev.map(a => a.id === id ? updatedAction : a));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error updating action:', err);
      throw err;
    }
  };

  const deleteAction = async (id: number) => {
    try {
      await mockDataService.deleteAction(id);
      setActions(prev => {
        const updatedActions = prev.filter(a => a.id !== id);
        calculateStats(updatedActions);
        return updatedActions;
      });
      setFilteredActions(prev => prev.filter(a => a.id !== id));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error deleting action:', err);
      throw err;
    }
  };

  const filterActions = (filters: {
    dateRange?: { start: Date | null; end: Date | null };
    searchTerm?: string;
    status?: string;
    area?: string;
  }) => {
    let filtered = [...actions];

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(action =>
        action.actionPlan.toLowerCase().includes(searchLower) ||
        action.tags?.toLowerCase().includes(searchLower) ||
        action.assignedTo?.toLowerCase().includes(searchLower)
      );
    }

    // Handle auto-filter (exclude "Done" actions) vs specific status filter
    if (filters.status === 'auto-filter') {
      // Auto-filter: show Not started, In Progress, and Delay only
      filtered = filtered.filter(action => 
        action.status === 'Not started' || 
        action.status === 'In Progress' || 
        action.status === 'Delay'
      );
    } else if (filters.status && filters.status !== '') {
      // Specific status filter
      filtered = filtered.filter(action => action.status === filters.status);
    }
    // If status is empty string, show all statuses (no filtering)

    if (filters.area) {
      filtered = filtered.filter(action => action.area === filters.area);
    }

    if (filters.dateRange?.start) {
      filtered = filtered.filter(action => new Date(action.fromDate) >= filters.dateRange!.start!);
    }

    if (filters.dateRange?.end) {
      filtered = filtered.filter(action => new Date(action.toDate) <= filters.dateRange!.end!);
    }

    setFilteredActions(filtered);
  };

  return (
    <ActionContext.Provider
      value={{
        actions,
        isLoading,
        error,
        areaStats,
        statusStats,
        addAction,
        updateAction,
        deleteAction,
        filterActions,
        filteredActions,
        lastUpdated,
      }}
    >
      {children}
    </ActionContext.Provider>
  );
};

export const useActions = () => {
  const context = useContext(ActionContext);
  if (context === undefined) {
    throw new Error('useActions must be used within an ActionProvider');
  }
  return context;
};