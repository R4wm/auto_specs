import React, { useState, useEffect } from 'react';
import { Build } from '../services/api';

interface FluidsEditorProps {
  buildData: Build;
  onChange: (data: Partial<Build>) => void;
}

export const FluidsEditor: React.FC<FluidsEditorProps> = ({ buildData, onChange }) => {
  const [formData, setFormData] = useState({
    engine_oil_type: buildData.engine_oil_type || '',
    engine_oil_weight: buildData.engine_oil_weight || '',
    engine_oil_capacity: buildData.engine_oil_capacity || '',
    transmission_fluid_type: buildData.transmission_fluid_type || '',
    differential_fluid_type: buildData.differential_fluid_type || '',
    coolant_type: buildData.coolant_type || ''
  });

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const oilTypes = [
    'Conventional',
    'Synthetic',
    'Synthetic Blend',
    'High Mileage',
    'Racing',
    'Diesel'
  ];

  const oilWeights = [
    '0W-20',
    '0W-30',
    '0W-40',
    '5W-20',
    '5W-30',
    '5W-40',
    '5W-50',
    '10W-30',
    '10W-40',
    '15W-40',
    '15W-50',
    '20W-50'
  ];

  const transmissionFluids = [
    'Dexron VI',
    'Dexron III',
    'Mercon V',
    'Mercon LV',
    'ATF+4',
    'CVT Fluid',
    'Manual Transmission Fluid',
    'Synthetic ATF'
  ];

  const differentialFluids = [
    '75W-90 GL-5',
    '75W-140 GL-5',
    '80W-90 GL-5',
    '85W-140 GL-5',
    'Synthetic 75W-90',
    'Synthetic 75W-140',
    'Limited Slip Additive Required'
  ];

  const coolantTypes = [
    'Ethylene Glycol (Green)',
    'OAT (Orange)',
    'HOAT (Yellow)',
    'DEX-COOL (Orange)',
    'Universal',
    'Distilled Water (Racing)'
  ];

  return (
    <div className="fluids-editor">
      <div className="editor-header">
        <h2>Fluids & Lubricants</h2>
        <p className="editor-subtitle">Track all fluids used in your build</p>
      </div>

      <div className="editor-form">
        {/* Engine Oil Section */}
        <section className="fluid-section">
          <h3>Engine Oil</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="engine_oil_type">Oil Type</label>
              <select
                id="engine_oil_type"
                name="engine_oil_type"
                value={formData.engine_oil_type}
                onChange={handleChange}
              >
                <option value="">Select type...</option>
                {oilTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="engine_oil_weight">Oil Weight</label>
              <select
                id="engine_oil_weight"
                name="engine_oil_weight"
                value={formData.engine_oil_weight}
                onChange={handleChange}
              >
                <option value="">Select weight...</option>
                {oilWeights.map(weight => (
                  <option key={weight} value={weight}>{weight}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="engine_oil_capacity">Capacity</label>
              <input
                type="text"
                id="engine_oil_capacity"
                name="engine_oil_capacity"
                value={formData.engine_oil_capacity}
                onChange={handleChange}
                placeholder="e.g., 5 quarts, 6 qts with filter"
              />
            </div>
          </div>
        </section>

        {/* Transmission Fluid Section */}
        <section className="fluid-section">
          <h3>Transmission Fluid</h3>
          <div className="form-group">
            <label htmlFor="transmission_fluid_type">Fluid Type</label>
            <select
              id="transmission_fluid_type"
              name="transmission_fluid_type"
              value={formData.transmission_fluid_type}
              onChange={handleChange}
            >
              <option value="">Select type...</option>
              {transmissionFluids.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="help-text">Check your transmission manufacturer specs</span>
          </div>
        </section>

        {/* Differential Fluid Section */}
        <section className="fluid-section">
          <h3>Differential Fluid</h3>
          <div className="form-group">
            <label htmlFor="differential_fluid_type">Fluid Type</label>
            <select
              id="differential_fluid_type"
              name="differential_fluid_type"
              value={formData.differential_fluid_type}
              onChange={handleChange}
            >
              <option value="">Select type...</option>
              {differentialFluids.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="help-text">GL-5 rating required for most applications</span>
          </div>
        </section>

        {/* Coolant Section */}
        <section className="fluid-section">
          <h3>Coolant</h3>
          <div className="form-group">
            <label htmlFor="coolant_type">Coolant Type</label>
            <select
              id="coolant_type"
              name="coolant_type"
              value={formData.coolant_type}
              onChange={handleChange}
            >
              <option value="">Select type...</option>
              {coolantTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <span className="help-text">Use manufacturer recommended type</span>
          </div>
        </section>
      </div>

      <style>{`
        .fluids-editor {
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

        .fluid-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .fluid-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
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
        .form-group select {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #4c51bf;
          box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
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
