export interface Action {
  id: number;
  actionPlan: string;
  area: string;
  discipline: string;
  fromDate: string;
  toDate: string;
  duration: number;
  status: 'Done' | 'In Progress' | 'Delay' | 'Not started';
  tags: string;
  assignedTo: string;
  notes: string;
}

export interface AreaStats {
  area: string;
  count: number;
  percentage: number;
}

export interface StatusStats {
  status: string;
  count: number;
  percentage: number;
  color: string;
}