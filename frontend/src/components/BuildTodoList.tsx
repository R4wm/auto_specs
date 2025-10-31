import React, { useState, useEffect } from 'react';
import { TodoItem } from './TodoItem';
import { TodoCreateModal } from './TodoCreateModal';
import { TodoCompleteModal } from './TodoCompleteModal';

interface Todo {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  completed_at?: string;
  completion_notes?: string;
  odometer_at_completion?: number;
  engine_hours_at_completion?: number;
  estimated_cost?: number;
  actual_cost?: number;
  maintenance_record_id?: number;
  created_at: string;
  updated_at: string;
}

interface TodoStats {
  status_counts: { [key: string]: number };
  category_counts: { [key: string]: number };
  overdue_count: number;
  total_estimated_cost: number;
  total_actual_cost: number;
}

interface BuildTodoListProps {
  buildId: number;
}

export const BuildTodoList: React.FC<BuildTodoListProps> = ({ buildId }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);

  const loadTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterCategory !== 'all') {
        params.append('category', filterCategory);
      }

      const response = await fetch(
        `/api/builds/${buildId}/todos?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load todos');

      const data = await response.json();
      setTodos(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/builds/${buildId}/todos/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load stats');

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => {
    loadTodos();
    loadStats();
  }, [buildId, filterStatus, filterCategory]);

  const handleStatusChange = async (todoId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');

      loadTodos();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleComplete = (todo: Todo) => {
    setSelectedTodo(todo);
    setShowCompleteModal(true);
  };

  const handleDelete = async (todoId: number) => {
    if (!confirm('Are you sure you want to delete this TODO?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete todo');

      loadTodos();
      loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  const pendingTodos = todos.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTodos = todos.filter(t => t.status === 'completed');

  const categories = [
    'Maintenance',
    'Upgrade',
    'Repair',
    'Inspection',
    'Alignment',
    'Tire Rotation',
    'Oil Change',
    'Tuning',
    'Other'
  ];

  if (loading) {
    return <div className="p-4">Loading todos...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Build TODO List</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add TODO
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <div className="text-2xl font-bold text-yellow-700">
              {stats.status_counts['pending'] || 0}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <div className="text-2xl font-bold text-blue-700">
              {stats.status_counts['in_progress'] || 0}
            </div>
            <div className="text-sm text-blue-600">In Progress</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="text-2xl font-bold text-green-700">
              {stats.status_counts['completed'] || 0}
            </div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <div className="text-2xl font-bold text-red-700">
              {stats.overdue_count}
            </div>
            <div className="text-sm text-red-600">Overdue</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending/In Progress Todos */}
      {pendingTodos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Active Tasks</h3>
          <div className="space-y-3">
            {pendingTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onStatusChange={handleStatusChange}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4 text-gray-600">
            Completed Tasks
          </h3>
          <div className="space-y-3 opacity-75">
            {completedTodos.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onStatusChange={handleStatusChange}
                onComplete={handleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {todos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No todos yet</p>
          <p className="text-sm">
            Add your first TODO to track maintenance and upgrades
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <TodoCreateModal
          buildId={buildId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTodos();
            loadStats();
          }}
        />
      )}

      {showCompleteModal && selectedTodo && (
        <TodoCompleteModal
          todo={selectedTodo}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedTodo(null);
          }}
          onSuccess={() => {
            setShowCompleteModal(false);
            setSelectedTodo(null);
            loadTodos();
            loadStats();
          }}
        />
      )}
    </div>
  );
};
