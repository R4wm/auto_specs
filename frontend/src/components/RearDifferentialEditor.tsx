import React, { useState, useEffect } from 'react';
import { buildsAPI } from '../services/api';

interface RearDifferentialEditorProps {
  buildId: number;
  initialData?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export const RearDifferentialEditor: React.FC<RearDifferentialEditorProps> = ({
  buildId,
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    housing: {
      manufacturer: '',
      model: '',
      material: '',
      type: '', // (e.g., 8.8", 9", 12-bolt)
      gear_ratio: '',
      weight: '',
      notes: ''
    },
    ring_and_pinion: {
      manufacturer: '',
      part_number: '',
      gear_ratio: '',
      ring_gear_diameter: '',
      tooth_count_ring: '',
      tooth_count_pinion: '',
      material: '',
      notes: ''
    },
    carrier: {
      type: '', // (e.g., open, limited slip, locking, spool)
      manufacturer: '',
      model: '',
      clutch_type: '', // (for limited slip)
      spring_preload: '',
      notes: ''
    },
    axle_shafts: {
      left: {
        manufacturer: '',
        material: '',
        diameter: '',
        spline_count: '',
        length: '',
        notes: ''
      },
      right: {
        manufacturer: '',
        material: '',
        diameter: '',
        spline_count: '',
        length: '',
        notes: ''
      }
    },
    bearings: {
      pinion_bearing_manufacturer: '',
      carrier_bearing_manufacturer: '',
      axle_bearing_manufacturer: '',
      preload_specs: '',
      notes: ''
    },
    seals_and_gaskets: {
      pinion_seal: '',
      axle_seals: '',
      cover_gasket: '',
      notes: ''
    },
    fluid: {
      type: '',
      weight: '',
      capacity: '',
      additive: '',
      last_changed: '',
      notes: ''
    }
  });

  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(prevData => ({
        ...prevData,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleInputChange = (section: string, field: string, value: string, subsection?: string) => {
    setFormData(prev => {
      const newData = { ...prev };

      if (subsection) {
        // Nested object (e.g., axle_shafts.left.manufacturer)
        (newData as any)[section] = {
          ...(newData as any)[section],
          [subsection]: {
            ...(newData as any)[section][subsection],
            [field]: value
          }
        };
      } else {
        // Simple object
        (newData as any)[section] = {
          ...(newData as any)[section],
          [field]: value
        };
      }

      return newData;
    });
  };

  const handleFileSelect = (componentType: string, file: File) => {
    setSelectedFiles(prev => ({
      ...prev,
      [componentType]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // Save the JSON data
      await buildsAPI.updateRearDifferential(buildId, formData);

      // Upload any selected photos
      for (const [componentType, file] of Object.entries(selectedFiles)) {
        await buildsAPI.uploadComponentPhoto(buildId, componentType, file);
      }

      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error('Failed to save rear differential:', err);
      setError(err.response?.data?.detail || 'Failed to save rear differential');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rear-differential-editor">
      <div className="editor-header">
        <h2>Rear Differential</h2>
        <p className="editor-subtitle">Track detailed specifications for your rear differential</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
        {/* Housing Section */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Differential Housing</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('diff_housing', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.housing.manufacturer}
              onChange={(e) => handleInputChange('housing', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.housing.model}
              onChange={(e) => handleInputChange('housing', 'model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Material"
              value={formData.housing.material}
              onChange={(e) => handleInputChange('housing', 'material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Type (e.g., 8.8\", 9\", 12-bolt)"
              value={formData.housing.type}
              onChange={(e) => handleInputChange('housing', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Gear Ratio (e.g., 3.73:1)"
              value={formData.housing.gear_ratio}
              onChange={(e) => handleInputChange('housing', 'gear_ratio', e.target.value)}
            />
            <input
              type="text"
              placeholder="Weight (lbs)"
              value={formData.housing.weight}
              onChange={(e) => handleInputChange('housing', 'weight', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.housing.notes}
            onChange={(e) => handleInputChange('housing', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Ring and Pinion Section */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Ring & Pinion</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('ring_pinion', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.ring_and_pinion.manufacturer}
              onChange={(e) => handleInputChange('ring_and_pinion', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Part Number"
              value={formData.ring_and_pinion.part_number}
              onChange={(e) => handleInputChange('ring_and_pinion', 'part_number', e.target.value)}
            />
            <input
              type="text"
              placeholder="Gear Ratio (e.g., 3.73:1)"
              value={formData.ring_and_pinion.gear_ratio}
              onChange={(e) => handleInputChange('ring_and_pinion', 'gear_ratio', e.target.value)}
            />
            <input
              type="text"
              placeholder="Ring Gear Diameter (in)"
              value={formData.ring_and_pinion.ring_gear_diameter}
              onChange={(e) => handleInputChange('ring_and_pinion', 'ring_gear_diameter', e.target.value)}
            />
            <input
              type="text"
              placeholder="Ring Tooth Count"
              value={formData.ring_and_pinion.tooth_count_ring}
              onChange={(e) => handleInputChange('ring_and_pinion', 'tooth_count_ring', e.target.value)}
            />
            <input
              type="text"
              placeholder="Pinion Tooth Count"
              value={formData.ring_and_pinion.tooth_count_pinion}
              onChange={(e) => handleInputChange('ring_and_pinion', 'tooth_count_pinion', e.target.value)}
            />
            <input
              type="text"
              placeholder="Material"
              value={formData.ring_and_pinion.material}
              onChange={(e) => handleInputChange('ring_and_pinion', 'material', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.ring_and_pinion.notes}
            onChange={(e) => handleInputChange('ring_and_pinion', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Carrier Section */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Carrier / Limited Slip</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('carrier', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Type (open, limited slip, locking, spool)"
              value={formData.carrier.type}
              onChange={(e) => handleInputChange('carrier', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.carrier.manufacturer}
              onChange={(e) => handleInputChange('carrier', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.carrier.model}
              onChange={(e) => handleInputChange('carrier', 'model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Clutch Type (for limited slip)"
              value={formData.carrier.clutch_type}
              onChange={(e) => handleInputChange('carrier', 'clutch_type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Spring Preload"
              value={formData.carrier.spring_preload}
              onChange={(e) => handleInputChange('carrier', 'spring_preload', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.carrier.notes}
            onChange={(e) => handleInputChange('carrier', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Axle Shafts Section */}
        <section className="editor-section">
          <h3>Axle Shafts</h3>

          {/* Left Axle */}
          <div className="subsection">
            <div className="section-header">
              <h4>Left Axle Shaft</h4>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleFileSelect('axle_left', e.target.files[0])}
              />
            </div>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Manufacturer"
                value={formData.axle_shafts.left.manufacturer}
                onChange={(e) => handleInputChange('axle_shafts', 'manufacturer', e.target.value, 'left')}
              />
              <input
                type="text"
                placeholder="Material"
                value={formData.axle_shafts.left.material}
                onChange={(e) => handleInputChange('axle_shafts', 'material', e.target.value, 'left')}
              />
              <input
                type="text"
                placeholder="Diameter (in)"
                value={formData.axle_shafts.left.diameter}
                onChange={(e) => handleInputChange('axle_shafts', 'diameter', e.target.value, 'left')}
              />
              <input
                type="text"
                placeholder="Spline Count"
                value={formData.axle_shafts.left.spline_count}
                onChange={(e) => handleInputChange('axle_shafts', 'spline_count', e.target.value, 'left')}
              />
              <input
                type="text"
                placeholder="Length (in)"
                value={formData.axle_shafts.left.length}
                onChange={(e) => handleInputChange('axle_shafts', 'length', e.target.value, 'left')}
              />
            </div>
            <textarea
              placeholder="Notes"
              value={formData.axle_shafts.left.notes}
              onChange={(e) => handleInputChange('axle_shafts', 'notes', e.target.value, 'left')}
              rows={1}
            />
          </div>

          {/* Right Axle */}
          <div className="subsection">
            <div className="section-header">
              <h4>Right Axle Shaft</h4>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files && handleFileSelect('axle_right', e.target.files[0])}
              />
            </div>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Manufacturer"
                value={formData.axle_shafts.right.manufacturer}
                onChange={(e) => handleInputChange('axle_shafts', 'manufacturer', e.target.value, 'right')}
              />
              <input
                type="text"
                placeholder="Material"
                value={formData.axle_shafts.right.material}
                onChange={(e) => handleInputChange('axle_shafts', 'material', e.target.value, 'right')}
              />
              <input
                type="text"
                placeholder="Diameter (in)"
                value={formData.axle_shafts.right.diameter}
                onChange={(e) => handleInputChange('axle_shafts', 'diameter', e.target.value, 'right')}
              />
              <input
                type="text"
                placeholder="Spline Count"
                value={formData.axle_shafts.right.spline_count}
                onChange={(e) => handleInputChange('axle_shafts', 'spline_count', e.target.value, 'right')}
              />
              <input
                type="text"
                placeholder="Length (in)"
                value={formData.axle_shafts.right.length}
                onChange={(e) => handleInputChange('axle_shafts', 'length', e.target.value, 'right')}
              />
            </div>
            <textarea
              placeholder="Notes"
              value={formData.axle_shafts.right.notes}
              onChange={(e) => handleInputChange('axle_shafts', 'notes', e.target.value, 'right')}
              rows={1}
            />
          </div>
        </section>

        {/* Bearings Section */}
        <section className="editor-section">
          <h3>Bearings</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Pinion Bearing Manufacturer"
              value={formData.bearings.pinion_bearing_manufacturer}
              onChange={(e) => handleInputChange('bearings', 'pinion_bearing_manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Carrier Bearing Manufacturer"
              value={formData.bearings.carrier_bearing_manufacturer}
              onChange={(e) => handleInputChange('bearings', 'carrier_bearing_manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Axle Bearing Manufacturer"
              value={formData.bearings.axle_bearing_manufacturer}
              onChange={(e) => handleInputChange('bearings', 'axle_bearing_manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Preload Specs"
              value={formData.bearings.preload_specs}
              onChange={(e) => handleInputChange('bearings', 'preload_specs', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.bearings.notes}
            onChange={(e) => handleInputChange('bearings', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Differential Fluid Section */}
        <section className="editor-section">
          <h3>Differential Fluid</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Type (e.g., Synthetic, Conventional)"
              value={formData.fluid.type}
              onChange={(e) => handleInputChange('fluid', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Weight (e.g., 75W-90)"
              value={formData.fluid.weight}
              onChange={(e) => handleInputChange('fluid', 'weight', e.target.value)}
            />
            <input
              type="text"
              placeholder="Capacity (quarts)"
              value={formData.fluid.capacity}
              onChange={(e) => handleInputChange('fluid', 'capacity', e.target.value)}
            />
            <input
              type="text"
              placeholder="Additive (e.g., friction modifier)"
              value={formData.fluid.additive}
              onChange={(e) => handleInputChange('fluid', 'additive', e.target.value)}
            />
            <input
              type="date"
              placeholder="Last Changed"
              value={formData.fluid.last_changed}
              onChange={(e) => handleInputChange('fluid', 'last_changed', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.fluid.notes}
            onChange={(e) => handleInputChange('fluid', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Rear Differential'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <style>{`
        .rear-differential-editor {
          background: white;
          border-radius: 8px;
          padding: 24px;
        }

        .editor-header {
          margin-bottom: 24px;
        }

        .editor-header h2 {
          font-size: 1.75rem;
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

        .editor-section {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
        }

        .editor-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-header h3,
        .section-header h4 {
          margin: 0;
        }

        .section-header input[type="file"] {
          font-size: 0.875rem;
        }

        .subsection {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .subsection:last-child {
          margin-bottom: 0;
        }

        .subsection h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #4a5568;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          margin-bottom: 12px;
        }

        .form-grid input {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
        }

        .form-grid input:focus {
          outline: none;
          border-color: #4c51bf;
          box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
        }

        textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
          resize: vertical;
        }

        textarea:focus {
          outline: none;
          border-color: #4c51bf;
          box-shadow: 0 0 0 3px rgba(76, 81, 191, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #4c51bf;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #434190;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #cbd5e0;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }

        .alert-error {
          background-color: #fed7d7;
          border: 1px solid #fc8181;
          color: #c53030;
        }

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};
