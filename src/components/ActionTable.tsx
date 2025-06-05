import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronDown, ChevronUp, Circle, Edit2, Check, X, Trash2 } from 'lucide-react';
import { Action } from '../types/action';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useActions } from '../context/ActionContext';
import { API_URL } from '../config';

interface ActionTableProps {
  actions: Action[];
  onActionDeleted?: (id: number) => void;
}

const ActionTable: React.FC<ActionTableProps> = ({ actions, onActionDeleted }) => {
  const { updateAction } = useActions();
  const [sortField, setSortField] = useState<keyof Action>('fromDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAction, setEditingAction] = useState<Partial<Action>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSort = (field: keyof Action) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEditing = (action: Action) => {
    setEditingId(action.id);
    setEditingAction(action);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingAction({});
    setError(null);
  };

  const saveEditing = async () => {
    if (!editingId) return;

    try {
      // Calculate duration if dates are changed
      if (editingAction.fromDate && editingAction.toDate) {
        const fromDate = new Date(editingAction.fromDate);
        const toDate = new Date(editingAction.toDate);
        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        editingAction.duration = diffDays;
      }

      await updateAction(editingId, editingAction);
      setEditingId(null);
      setEditingAction({});
      setError(null);
    } catch (err) {
      setError('Failed to update action. Please try again.');
      console.error('Error updating action:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const password = prompt('Please enter password to delete this action:');
    if (!password) return; // User cancelled the prompt
    
    if (password !== 'aimht') {
      setError('Incorrect password. Please try again.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this action?')) return;

    try {
      console.log('Attempting to delete action:', id);
      const response = await fetch(`${API_URL}/actions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Delete failed:', data);
        throw new Error(data.error || 'Failed to delete action');
      }

      console.log('Delete successful:', data);
      setError(null);
      
      // Notify parent component about the deletion
      if (onActionDeleted) {
        onActionDeleted(id);
      }
      
    } catch (err) {
      console.error('Error deleting action:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete action. Please try again.');
    }
  };

  const handleEditChange = (field: keyof Action, value: any) => {
    setEditingAction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sortedActions = [...actions].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'fromDate' || sortField === 'toDate') {
      const dateA = new Date(a[sortField]);
      const dateB = new Date(b[sortField]);
      comparison = dateA.getTime() - dateB.getTime();
    } else if (typeof a[sortField] === 'string' && typeof b[sortField] === 'string') {
      comparison = (a[sortField] as string).localeCompare(b[sortField] as string);
    } else {
      comparison = (a[sortField] as number) - (b[sortField] as number);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

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

  const SortIcon = ({ field }: { field: keyof Action }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="inline w-4 h-4" /> : <ChevronDown className="inline w-4 h-4" />;
  };

  return (
    <div className="overflow-x-auto shadow-md rounded-lg bg-white">
      <div className="max-h-[820px] overflow-y-auto">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="w-[4%] px-2 py-4"></th>
              <th 
                className="w-[26%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('actionPlan')}
              >
                Action Plan <SortIcon field="actionPlan" />
              </th>
              <th 
                className="w-[8%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('area')}
              >
                Area <SortIcon field="area" />
              </th>
              <th 
                className="w-[8%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('discipline')}
              >
                Discipline <SortIcon field="discipline" />
              </th>
              <th 
                className="w-[8%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('assignedTo')}
              >
                Assigned To <SortIcon field="assignedTo" />
              </th>
              <th 
                className="w-[8%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('fromDate')}
              >
                From <SortIcon field="fromDate" />
              </th>
              <th 
                className="w-[8%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('toDate')}
              >
                To <SortIcon field="toDate" />
              </th>
              <th 
                className="w-[4%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('duration')}
              >
                Days <SortIcon field="duration" />
              </th>
              <th 
                className="w-[6%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon field="status" />
              </th>
              <th 
                className="w-[20%] px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('notes')}
              >
                Notes <SortIcon field="notes" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-base">
            {sortedActions.map((action) => (
              <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-4">
                  {editingId === action.id ? (
                    <div className="flex space-x-1">
                      <button 
                        onClick={saveEditing} 
                        className="text-green-600 hover:text-green-800"
                        title="Save changes"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={cancelEditing} 
                        className="text-red-600 hover:text-red-800"
                        title="Cancel editing"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => startEditing(action)} 
                        className="text-gray-600 hover:text-gray-800"
                        title="Edit action"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(action.id)} 
                        className="text-red-600 hover:text-red-800"
                        title="Delete action"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {editingId === action.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingAction.actionPlan || ''}
                        onChange={(e) => handleEditChange('actionPlan', e.target.value)}
                        className="w-full px-3 py-2 border rounded text-base"
                        placeholder="Action Plan"
                      />
                      <input
                        type="text"
                        value={editingAction.tags || ''}
                        onChange={(e) => handleEditChange('tags', e.target.value)}
                        className="w-full px-3 py-2 border rounded text-base"
                        placeholder="Tags (comma separated)"
                      />
                    </div>
                  ) : (
                    <>
                      {action.actionPlan}
                      {action.tags && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {action.tags}
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === action.id ? (
                    <select
                      value={editingAction.area || ''}
                      onChange={(e) => handleEditChange('area', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-base"
                    >
                      <option value="Storage and handling">Storage and handling</option>
                      <option value="Washing">Washing</option>
                      <option value="Flotation">Flotation</option>
                      <option value="Tailing Management">Tailing Management</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Digitization">Digitization</option>
                      <option value="BWP">BWP</option>
                    </select>
                  ) : (
                    action.area
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === action.id ? (
                    <select
                      value={editingAction.discipline || ''}
                      onChange={(e) => handleEditChange('discipline', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-base"
                    >
                      <option value="All">All</option>
                      <option value="Automation">Automation</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Operation">Operation</option>
                      <option value="Process">Process</option>
                      <option value="Digitization">Digitization</option>
                    </select>
                  ) : (
                    action.discipline
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === action.id ? (
                    <input
                      type="text"
                      value={editingAction.assignedTo || ''}
                      onChange={(e) => handleEditChange('assignedTo', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-base"
                    />
                  ) : (
                    action.assignedTo
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === action.id ? (
                    <DatePicker
                      selected={editingAction.fromDate ? new Date(editingAction.fromDate) : null}
                      onChange={(date) => handleEditChange('fromDate', date?.toISOString().split('T')[0])}
                      className="w-full px-3 py-2 border rounded text-base"
                      dateFormat="dd/MM/yyyy"
                    />
                  ) : (
                    format(new Date(action.fromDate), 'dd/MM/yyyy')
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === action.id ? (
                    <DatePicker
                      selected={editingAction.toDate ? new Date(editingAction.toDate) : null}
                      onChange={(date) => handleEditChange('toDate', date?.toISOString().split('T')[0])}
                      className="w-full px-3 py-2 border rounded text-base"
                      dateFormat="dd/MM/yyyy"
                    />
                  ) : (
                    format(new Date(action.toDate), 'dd/MM/yyyy')
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {action.duration}
                </td>
                <td className="px-6 py-4 text-sm">
                  {editingId === action.id ? (
                    <select
                      value={editingAction.status || ''}
                      onChange={(e) => handleEditChange('status', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-base"
                    >
                      <option value="Not started">Not started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Delay">Delay</option>
                      <option value="Done">Done</option>
                    </select>
                  ) : (
                    <span className="flex items-center">
                      <Circle className={`w-4 h-4 mr-2 ${getStatusColor(action.status)}`} />
                      {action.status}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {editingId === action.id ? (
                    <textarea
                      value={editingAction.notes || ''}
                      onChange={(e) => handleEditChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border rounded text-base"
                      rows={2}
                    />
                  ) : (
                    action.notes
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActionTable;