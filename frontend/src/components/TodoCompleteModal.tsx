import React, { useState } from 'react';

interface Todo {
  id: number;
  title: string;
  category?: string;
}

interface TodoCompleteModalProps {
  todo: Todo;
  onClose: () => void;
  onSuccess: () => void;
}

export const TodoCompleteModal: React.FC<TodoCompleteModalProps> = ({
  todo,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    completion_notes: '',
    odometer_at_completion: '',
    engine_hours_at_completion: '',
    actual_cost: '',
    create_maintenance_record: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/todos/${todo.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          completion_notes: formData.completion_notes || null,
          odometer_at_completion: formData.odometer_at_completion
            ? parseFloat(formData.odometer_at_completion)
            : null,
          engine_hours_at_completion: formData.engine_hours_at_completion
            ? parseFloat(formData.engine_hours_at_completion)
            : null,
          actual_cost: formData.actual_cost
            ? parseFloat(formData.actual_cost)
            : null,
          create_maintenance_record: formData.create_maintenance_record
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete todo');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete todo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Complete TODO</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4 p-4 bg-gray-50 rounded">
          <div className="font-semibold text-lg">{todo.title}</div>
          {todo.category && (
            <div className="text-sm text-gray-600 mt-1">Category: {todo.category}</div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Completion Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Notes
            </label>
            <textarea
              name="completion_notes"
              value={formData.completion_notes}
              onChange={handleInputChange}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="What was done? Any issues or observations?"
            />
            <p className="text-xs text-gray-500 mt-1">
              Document what you did, parts used, any issues encountered, etc.
            </p>
          </div>

          {/* Odometer */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odometer Reading (miles)
            </label>
            <input
              type="number"
              name="odometer_at_completion"
              value={formData.odometer_at_completion}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 45000.5"
            />
          </div>

          {/* Engine Hours */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engine Hours
            </label>
            <input
              type="number"
              name="engine_hours_at_completion"
              value={formData.engine_hours_at_completion}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., 250.5"
            />
          </div>

          {/* Actual Cost */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Cost
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                name="actual_cost"
                value={formData.actual_cost}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full border rounded px-3 py-2 pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Create Maintenance Record Checkbox */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="create_maintenance_record"
                checked={formData.create_maintenance_record}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Create maintenance record and link to build history
              </span>
            </label>
            <p className="text-xs text-gray-500 ml-6 mt-1">
              This will create a formal maintenance entry that appears in your build's maintenance history and version snapshots.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Completing...' : 'Mark as Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
