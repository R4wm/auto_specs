import React, { useState, useEffect } from 'react';
import { Build } from '../services/api';

interface BasicInfoEditorProps {
  buildData: Build;
  onChange: (data: Partial<Build>) => void;
}

export const BasicInfoEditor: React.FC<BasicInfoEditorProps> = ({ buildData, onChange }) => {
  const [formData, setFormData] = useState({
    name: buildData.name || '',
    use_type: buildData.use_type || '',
    fuel_type: buildData.fuel_type || '',
    notes: buildData.notes || ''
  });

  useEffect(() => {
    // Update parent when form data changes
    onChange(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const useTypes = [
    'Street',
    'Race',
    'Street/Strip',
    'Off-Road',
    'Drag',
    'Road Course',
    'Autocross',
    'Daily Driver',
    'Show',
    'Other'
  ];

  const fuelTypes = [
    'Pump Gas (87 oct)',
    'Pump Gas (91 oct)',
    'Pump Gas (93 oct)',
    'E85',
    'E10',
    'Race Gas (100 oct)',
    'Race Gas (110 oct)',
    'Race Gas (116 oct)',
    'Methanol',
    'Diesel',
    'Other'
  ];

  return (
    <div className="basic-info-editor">
      <div className="editor-header">
        <h2>Basic Information</h2>
        <p className="editor-subtitle">Core details about your build</p>
      </div>

      <div className="editor-form">
        <div className="form-group">
          <label htmlFor="name">Build Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., 350 Small Block Street Build"
            required
          />
          <span className="help-text">Give your build a memorable name</span>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="use_type">Use Type</label>
            <select
              id="use_type"
              name="use_type"
              value={formData.use_type}
              onChange={handleChange}
            >
              <option value="">Select use type...</option>
              {useTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="help-text">Primary intended use</span>
          </div>

          <div className="form-group">
            <label htmlFor="fuel_type">Fuel Type</label>
            <select
              id="fuel_type"
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleChange}
            >
              <option value="">Select fuel type...</option>
              {fuelTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="help-text">Fuel you're running</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Build Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add any additional notes about your build goals, history, or specifications..."
            rows={6}
          />
          <span className="help-text">General notes, goals, or history for this build</span>
        </div>
      </div>

      <style>{`
        .basic-info-editor {
          background: white;
          border-radius: 8px;
          padding: 24px;
        }

        .editor-header {
          margin-bottom: 24px;
        }

        .editor-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .editor-subtitle {
          color: #718096;
          font-size: 0.9375rem;
        }

        .editor-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 0.9375rem;
          color: #2d3748;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
          outline: none;
          border-color: #4c51bf;
          box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .help-text {
          margin-top: 4px;
          font-size: 0.8125rem;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
