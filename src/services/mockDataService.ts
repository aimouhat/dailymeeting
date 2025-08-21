import { Action } from '../types/action';
<<<<<<< HEAD
// import mockActionsData from '../data/mockActions.json';
=======
import mockActionsData from '../data/mockActions.json';
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
import mockReportsData from '../data/mockReports.json';

// Simulate localStorage for persistence
const STORAGE_KEY = 'dailyMeetingActions';
const REPORTS_STORAGE_KEY = 'dailyMeetingReports';

class MockDataService {
  private actions: Action[] = [];
  private reports: any[] = [];
  private nextId: number = 1;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      // Load actions from localStorage or use mock data
      const storedActions = localStorage.getItem(STORAGE_KEY);
      if (storedActions) {
        this.actions = JSON.parse(storedActions);
        this.nextId = Math.max(...this.actions.map(a => a.id), 0) + 1;
      } else {
        this.actions = mockActionsData as Action[];
        this.nextId = Math.max(...this.actions.map(a => a.id), 0) + 1;
        this.saveToStorage();
      }

      // Load reports from localStorage or use mock data
      const storedReports = localStorage.getItem(REPORTS_STORAGE_KEY);
      if (storedReports) {
        this.reports = JSON.parse(storedReports);
      } else {
        this.reports = mockReportsData;
        this.saveReportsToStorage();
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
      this.actions = mockActionsData as Action[];
      this.reports = mockReportsData;
      this.nextId = Math.max(...this.actions.map(a => a.id), 0) + 1;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.actions));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private saveReportsToStorage() {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(this.reports));
    } catch (error) {
      console.error('Error saving reports to storage:', error);
    }
  }

  // Simulate async operations with delays
  private delay(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getAllActions(): Promise<Action[]> {
    await this.delay();
    
    // Check for overdue actions and update status
    const today = new Date().toISOString().split('T')[0];
    let hasUpdates = false;
    
    this.actions = this.actions.map(action => {
      if (action.status === 'In Progress' && action.toDate < today) {
        hasUpdates = true;
        return { ...action, status: 'Delay' as const };
      }
      return action;
    });
    
    if (hasUpdates) {
      this.saveToStorage();
    }
    
    return [...this.actions];
  }

  async addAction(actionData: Omit<Action, 'id'>): Promise<Action> {
    await this.delay();
    
    const newAction: Action = {
      ...actionData,
      id: this.nextId++
    };
    
    this.actions.push(newAction);
    this.saveToStorage();
    
    return newAction;
  }

  async updateAction(id: number, updates: Partial<Action>): Promise<Action> {
    await this.delay();
    
    const index = this.actions.findIndex(action => action.id === id);
    if (index === -1) {
      throw new Error('Action not found');
    }
    
    this.actions[index] = { ...this.actions[index], ...updates };
    this.saveToStorage();
    
    return this.actions[index];
  }

  async deleteAction(id: number): Promise<void> {
    await this.delay();
    
    const index = this.actions.findIndex(action => action.id === id);
    if (index === -1) {
      throw new Error('Action not found');
    }
    
    this.actions.splice(index, 1);
    this.saveToStorage();
  }

  async getAllReports(): Promise<any[]> {
    await this.delay();
    return [...this.reports];
  }

  async saveReport(reportData: { fileName: string; pdfData: string }): Promise<any> {
    await this.delay();
    
    const newReport = {
      id: reportData.fileName,
      date: new Date().toISOString().split('T')[0],
      fileName: reportData.fileName,
<<<<<<< HEAD
      filePath: `dailyrepport/${reportData.fileName}`
=======
      filePath: `Historical Reports/${reportData.fileName}`
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
    };
    
    // Remove existing report with same date if exists
    this.reports = this.reports.filter(report => report.fileName !== reportData.fileName);
    
    // Add new report at the beginning
    this.reports.unshift(newReport);
    this.saveReportsToStorage();
    
    return { success: true, filePath: newReport.filePath };
  }

  // Simulate WebSocket events
  onActionAdded?: (action: Action) => void;
  onActionUpdated?: (action: Action) => void;
  onActionDeleted?: (id: number) => void;

  // Method to trigger events (for testing)
  triggerActionAdded(action: Action) {
    if (this.onActionAdded) {
      this.onActionAdded(action);
    }
  }

  triggerActionUpdated(action: Action) {
    if (this.onActionUpdated) {
      this.onActionUpdated(action);
    }
  }

  triggerActionDeleted(id: number) {
    if (this.onActionDeleted) {
      this.onActionDeleted(id);
    }
  }
}

<<<<<<< HEAD
// export const mockDataService = new MockDataService();
=======
export const mockDataService = new MockDataService();
>>>>>>> 2574854e5c34a2aec331a214143ad71f80260c4b
