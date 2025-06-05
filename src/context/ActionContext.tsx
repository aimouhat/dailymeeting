import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Action, AreaStats, StatusStats } from '../types/action';
import { API_URL, WS_URL } from '../config';

interface ActionContextType {
  actions: Action[];
  isLoading: boolean;
  error: string | null;
  areaStats: AreaStats[];
  statusStats: StatusStats[];
  addAction: (action: Omit<Action, 'id'>) => Promise<void>;
  updateAction: (id: number, action: Partial<Action>) => Promise<void>;
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
  
  // WebSocket connection management
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;

  const connectWebSocket = () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('Connection attempt already in progress');
      return;
    }

    // Don't create a new connection if one already exists and is open
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    // Clean up any existing connection
    if (wsRef.current) {
      console.log('Cleaning up existing connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = true;
    console.log('Connecting to WebSocket:', WS_URL);
    
    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);

          if (data.type === 'CONNECTED') {
            console.log('Connection confirmed:', data.message);
          } else if (data.type === 'NEW_ACTION') {
            console.log('New action received via WebSocket:', data.action);
            // Update both states with the new action
            setActions(prevActions => {
              const newActions = [...prevActions, data.action];
              calculateStats(newActions);
              return newActions;
            });
            setFilteredActions(prevFiltered => [...prevFiltered, data.action]);
            setLastUpdated(new Date());
          } else if (data.type === 'ACTIONS_UPDATED') {
            console.log('Actions updated via WebSocket:', data.actions);
            setActions(data.actions);
            setFilteredActions(data.actions);
            calculateStats(data.actions);
            setLastUpdated(new Date());
          } else if (data.type === 'DELETE_ACTION') {
            console.log('Action deleted via WebSocket:', data.id);
            setActions(prev => {
              const updatedActions = prev.filter(action => action.id !== data.id);
              calculateStats(updatedActions);
              return updatedActions;
            });
            setFilteredActions(prev => prev.filter(action => action.id !== data.id));
            setLastUpdated(new Date());
          } else if (data.type === 'ACTION_UPDATED') {
            console.log('Action status automatically updated:', data.action);
            setActions(prev => {
              const updatedActions = prev.map(action => 
                action.id === data.action.id ? { ...action, ...data.action } : action
              );
              calculateStats(updatedActions);
              return updatedActions;
            });
            setFilteredActions(prev => 
              prev.map(action => action.id === data.action.id ? { ...action, ...data.action } : action)
            );
            setLastUpdated(new Date());
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        isConnectingRef.current = false;
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // Attempt to reconnect if not at max attempts
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, RECONNECT_DELAY);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      isConnectingRef.current = false;
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      isConnectingRef.current = false;
    };
  }, []);

  // Fetch actions from API
  useEffect(() => {
    const fetchActions = async () => {
      try {
        console.log('Fetching actions from API...');
        const response = await fetch(`${API_URL}/actions`);
        if (!response.ok) {
          throw new Error('Failed to fetch actions');
        }
        const data = await response.json();
        console.log('Fetched actions:', data);
        setActions(data);
        setFilteredActions(data);
        calculateStats(data);
        setLastUpdated(new Date());
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching actions:', err);
        setError('Failed to load actions');
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchActions();

    // Set up automatic refresh every 30 seconds instead of 10
    const refreshInterval = setInterval(fetchActions, 30000);

    // Cleanup function
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const calculateStats = (actions: Action[]) => {
    console.log('Calculating stats for actions:', actions);
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

    console.log('Setting new stats:', { areaStats, statusStats });
    setAreaStats(areaStats);
    setStatusStats(statusStats);
  };

  const addAction = async (action: Omit<Action, 'id'>) => {
    try {
      console.log('Adding new action:', action);
      const response = await fetch(`${API_URL}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to add action');
      }

      const newAction = await response.json();
      console.log('New action added successfully:', newAction);
      
      // Update both states with the new action
      setActions(prev => {
        const updatedActions = [...prev, newAction];
        calculateStats(updatedActions);
        return updatedActions;
      });
      setFilteredActions(prev => [...prev, newAction]);
      
      // Update lastUpdated to trigger a re-render
      setLastUpdated(new Date());
      
      return newAction;
    } catch (err) {
      console.error('Error adding action:', err);
      throw err;
    }
  };

  const updateAction = async (id: number, action: Partial<Action>) => {
    try {
      const response = await fetch(`${API_URL}/actions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        throw new Error('Failed to update action');
      }

      const updatedAction = await response.json();
      setActions(prev => prev.map(a => a.id === id ? { ...a, ...updatedAction } : a));
      setFilteredActions(prev => prev.map(a => a.id === id ? { ...a, ...updatedAction } : a));
      calculateStats(actions.map(a => a.id === id ? { ...a, ...updatedAction } : a));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error updating action:', err);
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

    if (filters.status) {
      filtered = filtered.filter(action => action.status === filters.status);
    }

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