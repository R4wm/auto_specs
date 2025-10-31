import React, { useState } from 'react';
import { maintenanceAPI } from '../services/api';

interface MaintenanceRecordModalProps {
  buildId: number;
  editingRecord?: any;
  onClose: () => void;
  onSuccess: () => void;
}

interface Part {
  description: string;
  brand: string;
  part_number: string;
  quantity: string;
  cost_per_unit: string;
}

export const MaintenanceRecordModal: React.FC<MaintenanceRecordModalProps> = ({
  buildId,
  editingRecord,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    maintenance_type: editingRecord?.maintenance_type || '',
    event_date: editingRecord?.timestamp ? new Date(editingRecord.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: editingRecord?.notes || '',
    odometer_miles: editingRecord?.odometer_miles?.toString() || '',
    engine_hours: editingRecord?.engine_hours?.toString() || '',
    labor_cost: ''
  });

  const [parts, setParts] = useState<Part[]>(
    editingRecord && (editingRecord.brand || editingRecord.part_number || editingRecord.quantity)
      ? [{
          description: '',
          brand: editingRecord.brand || '',
          part_number: editingRecord.part_number || '',
          quantity: editingRecord.quantity?.toString() || '1',
          cost_per_unit: ''
        }]
      : [{ description: '', brand: '', part_number: '', quantity: '1', cost_per_unit: '' }]
  );

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const maintenanceTypes = [
    'Oil Change',
    'Transmission Service',
    'Differential Service',
    'Coolant Flush',
    'Brake Service',
    'Tire Rotation',
    'Wheel Alignment',
    'Spark Plugs',
    'Air Filter',
    'Fuel Filter',
    'Inspection',
    'Repair',
    'Upgrade',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartChange = (index: number, field: keyof Part, value: string) => {
    setParts(prev => {
      const newParts = [...prev];
      newParts[index] = { ...newParts[index], [field]: value };
      return newParts;
    });
  };

  const addPart = () => {
    setParts(prev => [...prev, { description: '', brand: '', part_number: '', quantity: '1', cost_per_unit: '' }]);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculatePartsCost = () => {
    return parts.reduce((total, part) => {
      const qty = parseFloat(part.quantity) || 0;
      const cost = parseFloat(part.cost_per_unit) || 0;
      return total + (qty * cost);
    }, 0);
  };

  const calculateTotalCost = () => {
    const partsCost = calculatePartsCost();
    const laborCost = parseFloat(formData.labor_cost) || 0;
    return partsCost + laborCost;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Filter out empty parts
      const validParts = parts.filter(part =>
        part.description || part.brand || part.part_number || part.quantity || part.cost_per_unit
      );

      // Build parts list string for notes
      const partsListText = validParts.map(part => {
        const partDetails = [];
        if (part.description) partDetails.push(part.description);
        if (part.brand) partDetails.push(`Brand: ${part.brand}`);
        if (part.part_number) partDetails.push(`P/N: ${part.part_number}`);
        if (part.quantity) partDetails.push(`Qty: ${part.quantity}`);
        if (part.cost_per_unit) {
          const qty = parseFloat(part.quantity) || 1;
          const cost = parseFloat(part.cost_per_unit);
          partDetails.push(`Cost: $${cost.toFixed(2)} ea, Total: $${(qty * cost).toFixed(2)}`);
        }
        return partDetails.join(' | ');
      }).join('\n');

      const notesWithParts = [
        validParts.length > 0 ? `Parts:\n${partsListText}` : '',
        formData.notes ? `\nNotes:\n${formData.notes}` : ''
      ].filter(Boolean).join('\n');

      // Create maintenance record
      const maintenanceData = {
        maintenance_type: formData.maintenance_type,
        event_date: formData.event_date,
        notes: notesWithParts || undefined,
        odometer_miles: formData.odometer_miles ? parseFloat(formData.odometer_miles) : undefined,
        engine_hours: formData.engine_hours ? parseFloat(formData.engine_hours) : undefined,
        cost: calculateTotalCost() || undefined,
        // Store first part's data for backward compatibility
        brand: validParts[0]?.brand || undefined,
        part_number: validParts[0]?.part_number || undefined,
        quantity: validParts[0]?.quantity ? parseFloat(validParts[0].quantity) : undefined
      };

      // Use update if editing, create if new
      const response = editingRecord
        ? await maintenanceAPI.update(buildId, editingRecord.id, maintenanceData)
        : await maintenanceAPI.create(buildId, maintenanceData);

      // Upload files if any were selected
      if (selectedFiles.length > 0 && response.id) {
        for (const file of selectedFiles) {
          await maintenanceAPI.uploadAttachment(response.id, file, `Attachment for ${formData.maintenance_type}`);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to create maintenance record:', err);
      setError(err.response?.data?.detail || 'Failed to create maintenance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingRecord ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        {editingRecord && (
          <div className="edit-info-banner">
            <strong>Editing Record:</strong> {editingRecord.maintenance_type} from {new Date(editingRecord.timestamp).toLocaleDateString()}
            <br />
            <small>Changes will be saved and a revision history will be created</small>
          </div>
        )}

        <form onSubmit={handleSubmit} className="maintenance-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="maintenance_type">Maintenance Type *</label>
              <select
                id="maintenance_type"
                name="maintenance_type"
                value={formData.maintenance_type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select type...</option>
                {maintenanceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="event_date">Date *</label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                value={formData.event_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="odometer_miles">Odometer (miles)</label>
              <input
                type="number"
                id="odometer_miles"
                name="odometer_miles"
                value={formData.odometer_miles}
                onChange={handleInputChange}
                placeholder="e.g., 75000"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="engine_hours">Engine Hours</label>
              <input
                type="number"
                id="engine_hours"
                name="engine_hours"
                value={formData.engine_hours}
                onChange={handleInputChange}
                placeholder="e.g., 1500.5"
                step="0.1"
              />
            </div>
          </div>

          {/* Parts Section */}
          <div className="parts-section">
            <div className="section-header">
              <h3>Parts Used</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addPart}>
                + Add Part
              </button>
            </div>

            {parts.map((part, index) => (
              <div key={index} className="part-item">
                <div className="part-header">
                  <span className="part-number">Part #{index + 1}</span>
                  {parts.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removePart(index)}
                      title="Remove part"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="part-grid">
                  <input
                    type="text"
                    placeholder="Description (e.g., Motor Oil, Oil Filter)"
                    value={part.description}
                    onChange={(e) => handlePartChange(index, 'description', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Brand (e.g., Mobil 1)"
                    value={part.brand}
                    onChange={(e) => handlePartChange(index, 'brand', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Part Number"
                    value={part.part_number}
                    onChange={(e) => handlePartChange(index, 'part_number', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={part.quantity}
                    onChange={(e) => handlePartChange(index, 'quantity', e.target.value)}
                    step="0.1"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Cost per unit ($)"
                    value={part.cost_per_unit}
                    onChange={(e) => handlePartChange(index, 'cost_per_unit', e.target.value)}
                    step="0.01"
                    min="0"
                  />
                  {part.quantity && part.cost_per_unit && (
                    <div className="part-total">
                      Total: ${((parseFloat(part.quantity) || 0) * (parseFloat(part.cost_per_unit) || 0)).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Cost Summary */}
          <div className="cost-summary">
            <div className="cost-row">
              <label htmlFor="labor_cost">Labor Cost ($)</label>
              <input
                type="number"
                id="labor_cost"
                name="labor_cost"
                value={formData.labor_cost}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div className="cost-row">
              <span className="cost-label">Parts Subtotal:</span>
              <span className="cost-value">${calculatePartsCost().toFixed(2)}</span>
            </div>
            <div className="cost-row total">
              <span className="cost-label">Total Cost:</span>
              <span className="cost-value">${calculateTotalCost().toFixed(2)}</span>
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Additional Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional notes about this maintenance..."
              rows={4}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="files">Attachments (receipts, photos, etc.)</label>
            <input
              type="file"
              id="files"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                <p>{selectedFiles.length} file(s) selected:</p>
                <ul>
                  {selectedFiles.map((file, index) => (
                    <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Maintenance Record'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          overflow-y: auto;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #6b7280;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .modal-close:hover {
          color: #374151;
        }

        .maintenance-form {
          padding: 20px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          margin-bottom: 4px;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .parts-section {
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .part-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
        }

        .part-item:last-child {
          margin-bottom: 0;
        }

        .part-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .part-number {
          font-weight: 600;
          color: #4b5563;
          font-size: 0.875rem;
        }

        .btn-remove {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          font-size: 1.25rem;
          line-height: 1;
          padding: 0;
        }

        .btn-remove:hover {
          background: #dc2626;
        }

        .part-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 80px 100px 120px;
          gap: 8px;
          align-items: center;
        }

        .part-grid input {
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .part-grid input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .part-total {
          font-size: 0.875rem;
          font-weight: 600;
          color: #059669;
        }

        .cost-summary {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .cost-row:last-child {
          margin-bottom: 0;
        }

        .cost-row label {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .cost-row input {
          width: 150px;
          padding: 6px 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .cost-row.total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 2px solid #d1d5db;
        }

        .cost-label {
          font-weight: 600;
          font-size: 0.9375rem;
        }

        .cost-value {
          font-size: 1.125rem;
          font-weight: 700;
          color: #059669;
        }

        .selected-files {
          margin-top: 8px;
          padding: 12px;
          background-color: #f3f4f6;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .selected-files ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        .selected-files li {
          margin: 4px 0;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8125rem;
        }

        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #d1d5db;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin: 16px 20px;
        }

        .alert-error {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .part-grid {
            grid-template-columns: 1fr;
          }

          .cost-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }

          .cost-row input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
