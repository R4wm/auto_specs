import React, { useState, useEffect } from 'react';
import { Build } from '../services/api';

interface SuspensionEditorProps {
  buildData: Build;
  onChange: (data: Partial<Build>) => void;
}

export const SuspensionEditor: React.FC<SuspensionEditorProps> = ({ buildData, onChange }) => {
  // Parse suspension_json if it exists
  const suspensionData = buildData.suspension_json || {
    front_type: '',
    rear_type: '',
    front_left: { spring_rate: '', shock_model: '', adjustments: '' },
    front_right: { spring_rate: '', shock_model: '', adjustments: '' },
    rear_left: { spring_rate: '', shock_model: '', adjustments: '' },
    rear_right: { spring_rate: '', shock_model: '', adjustments: '' },
    sway_bar_front: '',
    sway_bar_rear: ''
  };

  const [formData, setFormData] = useState({
    front_type: suspensionData.front_type || '',
    rear_type: suspensionData.rear_type || '',

    // Front Left
    fl_spring_rate: suspensionData.front_left?.spring_rate || '',
    fl_shock_model: suspensionData.front_left?.shock_model || '',
    fl_adjustments: suspensionData.front_left?.adjustments || '',

    // Front Right
    fr_spring_rate: suspensionData.front_right?.spring_rate || '',
    fr_shock_model: suspensionData.front_right?.shock_model || '',
    fr_adjustments: suspensionData.front_right?.adjustments || '',

    // Rear Left
    rl_spring_rate: suspensionData.rear_left?.spring_rate || '',
    rl_shock_model: suspensionData.rear_left?.shock_model || '',
    rl_adjustments: suspensionData.rear_left?.adjustments || '',

    // Rear Right
    rr_spring_rate: suspensionData.rear_right?.spring_rate || '',
    rr_shock_model: suspensionData.rear_right?.shock_model || '',
    rr_adjustments: suspensionData.rear_right?.adjustments || '',

    // Sway Bars
    sway_bar_front: suspensionData.sway_bar_front || '',
    sway_bar_rear: suspensionData.sway_bar_rear || ''
  });

  useEffect(() => {
    // Convert flat form data back to nested JSON structure
    const suspension_json = {
      front_type: formData.front_type,
      rear_type: formData.rear_type,
      front_left: {
        spring_rate: formData.fl_spring_rate,
        shock_model: formData.fl_shock_model,
        adjustments: formData.fl_adjustments
      },
      front_right: {
        spring_rate: formData.fr_spring_rate,
        shock_model: formData.fr_shock_model,
        adjustments: formData.fr_adjustments
      },
      rear_left: {
        spring_rate: formData.rl_spring_rate,
        shock_model: formData.rl_shock_model,
        adjustments: formData.rl_adjustments
      },
      rear_right: {
        spring_rate: formData.rr_spring_rate,
        shock_model: formData.rr_shock_model,
        adjustments: formData.rr_adjustments
      },
      sway_bar_front: formData.sway_bar_front,
      sway_bar_rear: formData.sway_bar_rear
    };

    onChange({ suspension_json });
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const suspensionTypes = [
    'Independent A-arm',
    'MacPherson Strut',
    'Double Wishbone',
    'Multi-Link',
    'Solid Axle with Leaf Springs',
    'Solid Axle with Coil Springs',
    '4-Link',
    '3-Link',
    'Trailing Arm',
    'Semi-Trailing Arm',
    'Torsion Beam',
    'Air Suspension',
    'Custom'
  ];

  return (
    <div className="suspension-editor">
      <div className="editor-header">
        <h2>Suspension Setup</h2>
        <p className="editor-subtitle">Track suspension type, springs, shocks, and adjustments for each corner</p>
      </div>

      <div className="editor-form">
        {/* Suspension Type */}
        <section className="susp-section">
          <h3>Suspension Type</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="front_type">Front Suspension</label>
              <select
                id="front_type"
                name="front_type"
                value={formData.front_type}
                onChange={handleChange}
              >
                <option value="">Select type...</option>
                {suspensionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rear_type">Rear Suspension</label>
              <select
                id="rear_type"
                name="rear_type"
                value={formData.rear_type}
                onChange={handleChange}
              >
                <option value="">Select type...</option>
                {suspensionTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Front Suspension - Corner by Corner */}
        <section className="susp-section">
          <h3>Front Suspension</h3>

          <div className="corner-grid">
            {/* Front Left */}
            <div className="corner-card">
              <h4>Front Left</h4>
              <div className="form-group">
                <label htmlFor="fl_spring_rate">Spring Rate</label>
                <input
                  type="text"
                  id="fl_spring_rate"
                  name="fl_spring_rate"
                  value={formData.fl_spring_rate}
                  onChange={handleChange}
                  placeholder="e.g., 400 lb/in"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fl_shock_model">Shock Model</label>
                <input
                  type="text"
                  id="fl_shock_model"
                  name="fl_shock_model"
                  value={formData.fl_shock_model}
                  onChange={handleChange}
                  placeholder="e.g., Bilstein B6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fl_adjustments">Adjustments/Notes</label>
                <textarea
                  id="fl_adjustments"
                  name="fl_adjustments"
                  value={formData.fl_adjustments}
                  onChange={handleChange}
                  placeholder="Compression: 12 clicks, Rebound: 8 clicks"
                  rows={2}
                />
              </div>
            </div>

            {/* Front Right */}
            <div className="corner-card">
              <h4>Front Right</h4>
              <div className="form-group">
                <label htmlFor="fr_spring_rate">Spring Rate</label>
                <input
                  type="text"
                  id="fr_spring_rate"
                  name="fr_spring_rate"
                  value={formData.fr_spring_rate}
                  onChange={handleChange}
                  placeholder="e.g., 400 lb/in"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fr_shock_model">Shock Model</label>
                <input
                  type="text"
                  id="fr_shock_model"
                  name="fr_shock_model"
                  value={formData.fr_shock_model}
                  onChange={handleChange}
                  placeholder="e.g., Bilstein B6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fr_adjustments">Adjustments/Notes</label>
                <textarea
                  id="fr_adjustments"
                  name="fr_adjustments"
                  value={formData.fr_adjustments}
                  onChange={handleChange}
                  placeholder="Compression: 12 clicks, Rebound: 8 clicks"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Rear Suspension - Corner by Corner */}
        <section className="susp-section">
          <h3>Rear Suspension</h3>

          <div className="corner-grid">
            {/* Rear Left */}
            <div className="corner-card">
              <h4>Rear Left</h4>
              <div className="form-group">
                <label htmlFor="rl_spring_rate">Spring Rate</label>
                <input
                  type="text"
                  id="rl_spring_rate"
                  name="rl_spring_rate"
                  value={formData.rl_spring_rate}
                  onChange={handleChange}
                  placeholder="e.g., 200 lb/in"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rl_shock_model">Shock Model</label>
                <input
                  type="text"
                  id="rl_shock_model"
                  name="rl_shock_model"
                  value={formData.rl_shock_model}
                  onChange={handleChange}
                  placeholder="e.g., Bilstein B6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rl_adjustments">Adjustments/Notes</label>
                <textarea
                  id="rl_adjustments"
                  name="rl_adjustments"
                  value={formData.rl_adjustments}
                  onChange={handleChange}
                  placeholder="Compression: 12 clicks, Rebound: 8 clicks"
                  rows={2}
                />
              </div>
            </div>

            {/* Rear Right */}
            <div className="corner-card">
              <h4>Rear Right</h4>
              <div className="form-group">
                <label htmlFor="rr_spring_rate">Spring Rate</label>
                <input
                  type="text"
                  id="rr_spring_rate"
                  name="rr_spring_rate"
                  value={formData.rr_spring_rate}
                  onChange={handleChange}
                  placeholder="e.g., 200 lb/in"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rr_shock_model">Shock Model</label>
                <input
                  type="text"
                  id="rr_shock_model"
                  name="rr_shock_model"
                  value={formData.rr_shock_model}
                  onChange={handleChange}
                  placeholder="e.g., Bilstein B6"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rr_adjustments">Adjustments/Notes</label>
                <textarea
                  id="rr_adjustments"
                  name="rr_adjustments"
                  value={formData.rr_adjustments}
                  onChange={handleChange}
                  placeholder="Compression: 12 clicks, Rebound: 8 clicks"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sway Bars */}
        <section className="susp-section">
          <h3>Sway Bars</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="sway_bar_front">Front Sway Bar</label>
              <input
                type="text"
                id="sway_bar_front"
                name="sway_bar_front"
                value={formData.sway_bar_front}
                onChange={handleChange}
                placeholder="e.g., 1.25 inch, Addco #123"
              />
              <span className="help-text">Diameter or model</span>
            </div>

            <div className="form-group">
              <label htmlFor="sway_bar_rear">Rear Sway Bar</label>
              <input
                type="text"
                id="sway_bar_rear"
                name="sway_bar_rear"
                value={formData.sway_bar_rear}
                onChange={handleChange}
                placeholder="e.g., 0.875 inch, Hellwig #123"
              />
              <span className="help-text">Diameter or model</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .suspension-editor {
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
          gap: 32px;
        }

        .susp-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .susp-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .corner-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .corner-card {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          background: #f9fafb;
        }

        .corner-card h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #4c51bf;
          margin-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 12px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-group label {
          margin-bottom: 6px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #2d3748;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          background: white;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #4c51bf;
          box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          font-family: inherit;
        }

        .help-text {
          margin-top: 4px;
          font-size: 0.8125rem;
          color: #9ca3af;
        }

        @media (max-width: 768px) {
          .form-grid,
          .corner-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
