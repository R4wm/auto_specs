import React from 'react';

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
}

interface TodoItemProps {
  todo: Todo;
  onStatusChange: (todoId: number, newStatus: string) => void;
  onComplete: (todo: Todo) => void;
  onDelete: (todoId: number) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onStatusChange,
  onComplete,
  onDelete
}) => {
  const isOverdue = todo.due_date && new Date(todo.due_date) < new Date() && todo.status !== 'completed';

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`border rounded-lg p-4 ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold">{todo.title}</h3>

            {/* Priority Badge */}
            <span className={`text-xs px-2 py-1 rounded ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </span>

            {/* Status Badge */}
            <span className={`text-xs px-2 py-1 rounded ${statusColors[todo.status]}`}>
              {todo.status.replace('_', ' ')}
            </span>

            {/* Category Badge */}
            {todo.category && (
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                {todo.category}
              </span>
            )}

            {/* Overdue Badge */}
            {isOverdue && (
              <span className="text-xs px-2 py-1 rounded bg-red-500 text-white font-semibold">
                OVERDUE
              </span>
            )}
          </div>

          {todo.description && (
            <p className="text-gray-600 text-sm mb-2">{todo.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {todo.due_date && (
              <div className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                📅 Due: {formatDate(todo.due_date)}
              </div>
            )}

            {todo.estimated_cost && (
              <div>💰 Est: ${todo.estimated_cost.toFixed(2)}</div>
            )}

            {todo.actual_cost && (
              <div>💵 Actual: ${todo.actual_cost.toFixed(2)}</div>
            )}
          </div>

          {/* Completion Details */}
          {todo.status === 'completed' && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <div className="font-semibold">Completed: {formatDate(todo.completed_at)}</div>

                {todo.completion_notes && (
                  <div className="mt-1">
                    <span className="font-medium">Notes:</span> {todo.completion_notes}
                  </div>
                )}

                {todo.odometer_at_completion && (
                  <div className="mt-1">
                    <span className="font-medium">Odometer:</span> {todo.odometer_at_completion.toLocaleString()} mi
                  </div>
                )}

                {todo.engine_hours_at_completion && (
                  <div className="mt-1">
                    <span className="font-medium">Engine Hours:</span> {todo.engine_hours_at_completion} hrs
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 ml-4">
          {todo.status !== 'completed' && (
            <>
              <button
                onClick={() => onComplete(todo)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Complete
              </button>

              {todo.status === 'pending' && (
                <button
                  onClick={() => onStatusChange(todo.id, 'in_progress')}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Start
                </button>
              )}

              {todo.status === 'in_progress' && (
                <button
                  onClick={() => onStatusChange(todo.id, 'pending')}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Pause
                </button>
              )}
            </>
          )}

          {todo.status === 'completed' && (
            <button
              onClick={() => onStatusChange(todo.id, 'pending')}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Reopen
            </button>
          )}

          <button
            onClick={() => onDelete(todo.id)}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
