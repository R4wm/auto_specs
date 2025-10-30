import React, { useState, useEffect } from 'react';
import { buildsAPI } from '../services/api';

interface EngineInternalsEditorProps {
  buildId: number;
  initialData?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export const EngineInternalsEditor: React.FC<EngineInternalsEditorProps> = ({
  buildId,
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    block: {
      manufacturer: '',
      model: '',
      material: '',
      deck_height: '',
      bore_size: '',
      sleeve_material: '',
      notes: ''
    },
    crankshaft: {
      manufacturer: '',
      model: '',
      material: '',
      stroke: '',
      main_journal_diameter: '',
      rod_journal_diameter: '',
      weight: '',
      balance_percentage: '',
      notes: ''
    },
    pistons: Array(8).fill(null).map(() => ({
      manufacturer: '',
      model: '',
      material: '',
      compression_height: '',
      dome_volume_cc: '',
      ring_pack: '',
      weight: '',
      skirt_coating: '',
      pin_diameter: '',
      notes: ''
    })),
    connecting_rods: Array(8).fill(null).map(() => ({
      manufacturer: '',
      model: '',
      material: '',
      length: '',
      big_end_width: '',
      small_end_diameter: '',
      weight: '',
      bolts: '',
      notes: ''
    })),
    camshaft: {
      manufacturer: '',
      model: '',
      material: '',
      duration_intake: '',
      duration_exhaust: '',
      lift_intake: '',
      lift_exhaust: '',
      lobe_separation_angle: '',
      notes: ''
    },
    cylinder_heads: {
      manufacturer: '',
      model: '',
      material: '',
      chamber_volume_cc: '',
      intake_port_cc: '',
      exhaust_port_cc: '',
      valve_size_intake: '',
      valve_size_exhaust: '',
      spring_pressure: '',
      notes: ''
    },
    valvetrain: {
      lifters_type: '',
      lifters_manufacturer: '',
      pushrods_material: '',
      pushrods_length: '',
      rocker_arms_ratio: '',
      rocker_arms_manufacturer: '',
      notes: ''
    },
    timing_components: {
      timing_chain_type: '',
      timing_set_manufacturer: '',
      cam_gear_material: '',
      crank_gear_material: '',
      tensioner_type: '',
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

  const handleInputChange = (section: string, field: string, value: string, index?: number) => {
    setFormData(prev => {
      const newData = { ...prev };

      if (index !== undefined) {
        // Array field (pistons or connecting_rods)
        const sectionArray = [...(newData as any)[section]];
        sectionArray[index] = {
          ...sectionArray[index],
          [field]: value
        };
        (newData as any)[section] = sectionArray;
      } else {
        // Object field
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
      await buildsAPI.updateEngineInternals(buildId, formData);

      // Upload any selected photos
      for (const [componentType, file] of Object.entries(selectedFiles)) {
        await buildsAPI.uploadComponentPhoto(buildId, componentType, file);
      }

      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error('Failed to save engine internals:', err);
      setError(err.response?.data?.detail || 'Failed to save engine internals');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="engine-internals-editor">
      <div className="editor-header">
        <h2>Engine Internals</h2>
        <p className="editor-subtitle">Track detailed specifications for all engine components</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
        {/* Engine Block Section */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Engine Block</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('engine_block', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.block.manufacturer}
              onChange={(e) => handleInputChange('block', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.block.model}
              onChange={(e) => handleInputChange('block', 'model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Material (e.g., Cast Iron)"
              value={formData.block.material}
              onChange={(e) => handleInputChange('block', 'material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Deck Height (in)"
              value={formData.block.deck_height}
              onChange={(e) => handleInputChange('block', 'deck_height', e.target.value)}
            />
            <input
              type="text"
              placeholder="Bore Size (in)"
              value={formData.block.bore_size}
              onChange={(e) => handleInputChange('block', 'bore_size', e.target.value)}
            />
            <input
              type="text"
              placeholder="Sleeve Material"
              value={formData.block.sleeve_material}
              onChange={(e) => handleInputChange('block', 'sleeve_material', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.block.notes}
            onChange={(e) => handleInputChange('block', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Crankshaft Section */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Crankshaft</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('crankshaft', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.crankshaft.manufacturer}
              onChange={(e) => handleInputChange('crankshaft', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.crankshaft.model}
              onChange={(e) => handleInputChange('crankshaft', 'model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Material (e.g., Forged Steel)"
              value={formData.crankshaft.material}
              onChange={(e) => handleInputChange('crankshaft', 'material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Stroke (in)"
              value={formData.crankshaft.stroke}
              onChange={(e) => handleInputChange('crankshaft', 'stroke', e.target.value)}
            />
            <input
              type="text"
              placeholder="Main Journal Diameter (in)"
              value={formData.crankshaft.main_journal_diameter}
              onChange={(e) => handleInputChange('crankshaft', 'main_journal_diameter', e.target.value)}
            />
            <input
              type="text"
              placeholder="Rod Journal Diameter (in)"
              value={formData.crankshaft.rod_journal_diameter}
              onChange={(e) => handleInputChange('crankshaft', 'rod_journal_diameter', e.target.value)}
            />
            <input
              type="text"
              placeholder="Weight (lbs)"
              value={formData.crankshaft.weight}
              onChange={(e) => handleInputChange('crankshaft', 'weight', e.target.value)}
            />
            <input
              type="text"
              placeholder="Balance Percentage (%)"
              value={formData.crankshaft.balance_percentage}
              onChange={(e) => handleInputChange('crankshaft', 'balance_percentage', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.crankshaft.notes}
            onChange={(e) => handleInputChange('crankshaft', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Pistons Section */}
        <section className="editor-section">
          <h3>Pistons (Individual Tracking)</h3>
          {formData.pistons.map((piston, index) => (
            <div key={index} className="subsection">
              <div className="section-header">
                <h4>Piston #{index + 1}</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileSelect(`piston_${index + 1}`, e.target.files[0])}
                />
              </div>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Manufacturer"
                  value={piston.manufacturer}
                  onChange={(e) => handleInputChange('pistons', 'manufacturer', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={piston.model}
                  onChange={(e) => handleInputChange('pistons', 'model', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Material"
                  value={piston.material}
                  onChange={(e) => handleInputChange('pistons', 'material', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Compression Height (in)"
                  value={piston.compression_height}
                  onChange={(e) => handleInputChange('pistons', 'compression_height', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Dome Volume (cc)"
                  value={piston.dome_volume_cc}
                  onChange={(e) => handleInputChange('pistons', 'dome_volume_cc', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Ring Pack"
                  value={piston.ring_pack}
                  onChange={(e) => handleInputChange('pistons', 'ring_pack', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Weight (g)"
                  value={piston.weight}
                  onChange={(e) => handleInputChange('pistons', 'weight', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Skirt Coating"
                  value={piston.skirt_coating}
                  onChange={(e) => handleInputChange('pistons', 'skirt_coating', e.target.value, index)}
                />
              </div>
              <textarea
                placeholder="Notes"
                value={piston.notes}
                onChange={(e) => handleInputChange('pistons', 'notes', e.target.value, index)}
                rows={1}
              />
            </div>
          ))}
        </section>

        {/* Connecting Rods Section */}
        <section className="editor-section">
          <h3>Connecting Rods (Individual Tracking)</h3>
          {formData.connecting_rods.map((rod, index) => (
            <div key={index} className="subsection">
              <div className="section-header">
                <h4>Rod #{index + 1}</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileSelect(`connecting_rod_${index + 1}`, e.target.files[0])}
                />
              </div>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Manufacturer"
                  value={rod.manufacturer}
                  onChange={(e) => handleInputChange('connecting_rods', 'manufacturer', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={rod.model}
                  onChange={(e) => handleInputChange('connecting_rods', 'model', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Material"
                  value={rod.material}
                  onChange={(e) => handleInputChange('connecting_rods', 'material', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Length (center to center, in)"
                  value={rod.length}
                  onChange={(e) => handleInputChange('connecting_rods', 'length', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Big End Width (in)"
                  value={rod.big_end_width}
                  onChange={(e) => handleInputChange('connecting_rods', 'big_end_width', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Small End Diameter (in)"
                  value={rod.small_end_diameter}
                  onChange={(e) => handleInputChange('connecting_rods', 'small_end_diameter', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Weight (g)"
                  value={rod.weight}
                  onChange={(e) => handleInputChange('connecting_rods', 'weight', e.target.value, index)}
                />
                <input
                  type="text"
                  placeholder="Bolts (type/grade)"
                  value={rod.bolts}
                  onChange={(e) => handleInputChange('connecting_rods', 'bolts', e.target.value, index)}
                />
              </div>
              <textarea
                placeholder="Notes"
                value={rod.notes}
                onChange={(e) => handleInputChange('connecting_rods', 'notes', e.target.value, index)}
                rows={1}
              />
            </div>
          ))}
        </section>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Engine Internals'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <style>{`
        .engine-internals-editor {
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
