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
  refreshData: () => Promise<void>;
  currentFilters: {
    dateRange: { start: Date | null; end: Date | null };
    searchTerm: string;
    status: string;
    area: string;
  };
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
  
  // Store current filters to preserve them during data refresh
  const [currentFilters, setCurrentFilters] = useState({
    dateRange: { start: null as Date | null, end: null as Date | null },
    searchTerm: '',
    status: 'auto-filter',
    area: ''
  });

  // Load initial data
  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await mockDataService.getAllActions();
      setActions(data);
      calculateStats(data);
      setLastUpdated(new Date());
      
      // Reapply current filters to the new data
      applyFiltersToData(data, currentFilters);
    } catch (err) {
      console.error('Error loading actions:', err);
      setError('Failed to load actions');
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh function that preserves filters
  const refreshData = async () => {
    await loadActions();
  };

  // Set up periodic refresh without page reload (every 5 minutes)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshData();
    }, 300000); // 5 minutes instead of 1 minute to reduce frequency

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
        applyFiltersToData(newActions, currentFilters);
        return newActions;
      });
      setLastUpdated(new Date());
    };

    mockDataService.onActionUpdated = (action: Action) => {
      setActions(prev => {
        const updatedActions = prev.map(a => a.id === action.id ? action : a);
        calculateStats(updatedActions);
        applyFiltersToData(updatedActions, currentFilters);
        return updatedActions;
      });
      setLastUpdated(new Date());
    };

    mockDataService.onActionDeleted = (id: number) => {
      setActions(prev => {
        const updatedActions = prev.filter(a => a.id !== id);
        calculateStats(updatedActions);
        applyFiltersToData(updatedActions, currentFilters);
        return updatedActions;
      });
      setLastUpdated(new Date());
    };

    return () => {
      mockDataService.onActionAdded = undefined;
      mockDataService.onActionUpdated = undefined;
      mockDataService.onActionDeleted = undefined;
    };
  }, [currentFilters]);

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

    // Calculate status stats with colors - ensure all 4 statuses are included
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

    // Ensure all 4 status types are included, even if count is 0
    const allStatusTypes = ['Not started', 'In Progress', 'Delay', 'Done'];
    const statusStats = allStatusTypes.map(status => ({
      status,
      count: statusCounts[status] || 0,
      percentage: actions.length > 0 ? ((statusCounts[status] || 0) / actions.length) * 100 : 0,
      color: statusColors[status as keyof typeof statusColors] || '#6B7280'
    }));

    setAreaStats(areaStats);
    setStatusStats(statusStats);
  };

  const applyFiltersToData = (data: Action[], filters: typeof currentFilters) => {
    let filtered = [...data];

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

  const addAction = async (action: Omit<Action, 'id'>) => {
    try {
      const newAction = await mockDataService.addAction(action);
      setActions(prev => {
        const updatedActions = [...prev, newAction];
        calculateStats(updatedActions);
        applyFiltersToData(updatedActions, currentFilters);
        return updatedActions;
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
        applyFiltersToData(updatedActions, currentFilters);
        return updatedActions;
      });
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
        applyFiltersToData(updatedActions, currentFilters);
        return updatedActions;
      });
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
    // Update current filters
    const newFilters = {
      dateRange: filters.dateRange || { start: null, end: null },
      searchTerm: filters.searchTerm || '',
      status: filters.status || 'auto-filter',
      area: filters.area || ''
    };
    
    setCurrentFilters(newFilters);
    applyFiltersToData(actions, newFilters);
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
        refreshData,
        currentFilters,
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