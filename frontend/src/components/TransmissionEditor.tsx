import React, { useState, useEffect } from 'react';
import { buildsAPI } from '../services/api';

interface TransmissionEditorProps {
  buildId: number;
  initialData?: any;
  onSave?: () => void;
  onCancel?: () => void;
}

export const TransmissionEditor: React.FC<TransmissionEditorProps> = ({
  buildId,
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    basic: {
      manufacturer: '',
      model: '',
      type: '', // (manual, automatic, CVT, dual-clutch)
      number_of_gears: '',
      max_input_torque: '',
      weight: '',
      notes: ''
    },
    gear_ratios: {
      first: '',
      second: '',
      third: '',
      fourth: '',
      fifth: '',
      sixth: '',
      seventh: '',
      eighth: '',
      reverse: '',
      final_drive: ''
    },
    clutch_or_converter: {
      type: '', // (clutch for manual, torque converter for automatic)
      manufacturer: '',
      model: '',
      diameter: '', // clutch diameter or converter diameter
      stall_speed: '', // for torque converter
      material: '', // clutch disc material
      pressure_plate_type: '',
      notes: ''
    },
    case_and_housing: {
      material: '',
      bellhousing_pattern: '',
      tail_housing_type: '',
      speedometer_gear: '',
      notes: ''
    },
    shift_mechanism: {
      type: '', // (hydraulic, cable, electric, mechanical)
      shifter_manufacturer: '',
      shifter_model: '',
      shift_kit_installed: '',
      valve_body_modifications: '',
      notes: ''
    },
    internals: {
      clutch_packs: '',
      bands: '',
      planetary_gearset_type: '',
      output_shaft_material: '',
      input_shaft_material: '',
      bearing_upgrades: '',
      notes: ''
    },
    cooling: {
      cooler_type: '', // (stock, external, stacked plate)
      cooler_manufacturer: '',
      cooler_location: '',
      line_size: '',
      notes: ''
    },
    fluid: {
      type: '',
      capacity: '',
      last_changed: '',
      filter_type: '',
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

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      (newData as any)[section] = {
        ...(newData as any)[section],
        [field]: value
      };
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
      await buildsAPI.updateTransmission(buildId, formData);

      // Upload any selected photos
      for (const [componentType, file] of Object.entries(selectedFiles)) {
        await buildsAPI.uploadComponentPhoto(buildId, componentType, file);
      }

      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error('Failed to save transmission:', err);
      setError(err.response?.data?.detail || 'Failed to save transmission');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="transmission-editor">
      <div className="editor-header">
        <h2>Transmission</h2>
        <p className="editor-subtitle">Track detailed specifications for your transmission</p>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="editor-form">
        {/* Basic Information */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Basic Information</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('transmission', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.basic.manufacturer}
              onChange={(e) => handleInputChange('basic', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.basic.model}
              onChange={(e) => handleInputChange('basic', 'model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Type (manual, automatic, CVT)"
              value={formData.basic.type}
              onChange={(e) => handleInputChange('basic', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Number of Gears"
              value={formData.basic.number_of_gears}
              onChange={(e) => handleInputChange('basic', 'number_of_gears', e.target.value)}
            />
            <input
              type="text"
              placeholder="Max Input Torque (lb-ft)"
              value={formData.basic.max_input_torque}
              onChange={(e) => handleInputChange('basic', 'max_input_torque', e.target.value)}
            />
            <input
              type="text"
              placeholder="Weight (lbs)"
              value={formData.basic.weight}
              onChange={(e) => handleInputChange('basic', 'weight', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.basic.notes}
            onChange={(e) => handleInputChange('basic', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Gear Ratios */}
        <section className="editor-section">
          <h3>Gear Ratios</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="1st Gear (e.g., 2.97:1)"
              value={formData.gear_ratios.first}
              onChange={(e) => handleInputChange('gear_ratios', 'first', e.target.value)}
            />
            <input
              type="text"
              placeholder="2nd Gear"
              value={formData.gear_ratios.second}
              onChange={(e) => handleInputChange('gear_ratios', 'second', e.target.value)}
            />
            <input
              type="text"
              placeholder="3rd Gear"
              value={formData.gear_ratios.third}
              onChange={(e) => handleInputChange('gear_ratios', 'third', e.target.value)}
            />
            <input
              type="text"
              placeholder="4th Gear"
              value={formData.gear_ratios.fourth}
              onChange={(e) => handleInputChange('gear_ratios', 'fourth', e.target.value)}
            />
            <input
              type="text"
              placeholder="5th Gear"
              value={formData.gear_ratios.fifth}
              onChange={(e) => handleInputChange('gear_ratios', 'fifth', e.target.value)}
            />
            <input
              type="text"
              placeholder="6th Gear"
              value={formData.gear_ratios.sixth}
              onChange={(e) => handleInputChange('gear_ratios', 'sixth', e.target.value)}
            />
            <input
              type="text"
              placeholder="7th Gear"
              value={formData.gear_ratios.seventh}
              onChange={(e) => handleInputChange('gear_ratios', 'seventh', e.target.value)}
            />
            <input
              type="text"
              placeholder="8th Gear"
              value={formData.gear_ratios.eighth}
              onChange={(e) => handleInputChange('gear_ratios', 'eighth', e.target.value)}
            />
            <input
              type="text"
              placeholder="Reverse"
              value={formData.gear_ratios.reverse}
              onChange={(e) => handleInputChange('gear_ratios', 'reverse', e.target.value)}
            />
            <input
              type="text"
              placeholder="Final Drive"
              value={formData.gear_ratios.final_drive}
              onChange={(e) => handleInputChange('gear_ratios', 'final_drive', e.target.value)}
            />
          </div>
        </section>

        {/* Clutch or Torque Converter */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Clutch / Torque Converter</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('clutch_converter', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Type (clutch, torque converter)"
              value={formData.clutch_or_converter.type}
              onChange={(e) => handleInputChange('clutch_or_converter', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Manufacturer"
              value={formData.clutch_or_converter.manufacturer}
              onChange={(e) => handleInputChange('clutch_or_converter', 'manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={formData.clutch_or_converter.model}
              onChange={(e) => handleInputChange('clutch_or_converter', 'model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Diameter (in)"
              value={formData.clutch_or_converter.diameter}
              onChange={(e) => handleInputChange('clutch_or_converter', 'diameter', e.target.value)}
            />
            <input
              type="text"
              placeholder="Stall Speed (RPM, for converter)"
              value={formData.clutch_or_converter.stall_speed}
              onChange={(e) => handleInputChange('clutch_or_converter', 'stall_speed', e.target.value)}
            />
            <input
              type="text"
              placeholder="Material (clutch disc)"
              value={formData.clutch_or_converter.material}
              onChange={(e) => handleInputChange('clutch_or_converter', 'material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Pressure Plate Type"
              value={formData.clutch_or_converter.pressure_plate_type}
              onChange={(e) => handleInputChange('clutch_or_converter', 'pressure_plate_type', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.clutch_or_converter.notes}
            onChange={(e) => handleInputChange('clutch_or_converter', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Case and Housing */}
        <section className="editor-section">
          <h3>Case & Housing</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Material"
              value={formData.case_and_housing.material}
              onChange={(e) => handleInputChange('case_and_housing', 'material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Bellhousing Pattern"
              value={formData.case_and_housing.bellhousing_pattern}
              onChange={(e) => handleInputChange('case_and_housing', 'bellhousing_pattern', e.target.value)}
            />
            <input
              type="text"
              placeholder="Tail Housing Type"
              value={formData.case_and_housing.tail_housing_type}
              onChange={(e) => handleInputChange('case_and_housing', 'tail_housing_type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Speedometer Gear"
              value={formData.case_and_housing.speedometer_gear}
              onChange={(e) => handleInputChange('case_and_housing', 'speedometer_gear', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.case_and_housing.notes}
            onChange={(e) => handleInputChange('case_and_housing', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Shift Mechanism */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Shift Mechanism</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('shifter', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Type (hydraulic, cable, electric)"
              value={formData.shift_mechanism.type}
              onChange={(e) => handleInputChange('shift_mechanism', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Shifter Manufacturer"
              value={formData.shift_mechanism.shifter_manufacturer}
              onChange={(e) => handleInputChange('shift_mechanism', 'shifter_manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Shifter Model"
              value={formData.shift_mechanism.shifter_model}
              onChange={(e) => handleInputChange('shift_mechanism', 'shifter_model', e.target.value)}
            />
            <input
              type="text"
              placeholder="Shift Kit Installed"
              value={formData.shift_mechanism.shift_kit_installed}
              onChange={(e) => handleInputChange('shift_mechanism', 'shift_kit_installed', e.target.value)}
            />
            <input
              type="text"
              placeholder="Valve Body Modifications"
              value={formData.shift_mechanism.valve_body_modifications}
              onChange={(e) => handleInputChange('shift_mechanism', 'valve_body_modifications', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.shift_mechanism.notes}
            onChange={(e) => handleInputChange('shift_mechanism', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Internal Components */}
        <section className="editor-section">
          <h3>Internal Components</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Clutch Packs (for auto)"
              value={formData.internals.clutch_packs}
              onChange={(e) => handleInputChange('internals', 'clutch_packs', e.target.value)}
            />
            <input
              type="text"
              placeholder="Bands (for auto)"
              value={formData.internals.bands}
              onChange={(e) => handleInputChange('internals', 'bands', e.target.value)}
            />
            <input
              type="text"
              placeholder="Planetary Gearset Type"
              value={formData.internals.planetary_gearset_type}
              onChange={(e) => handleInputChange('internals', 'planetary_gearset_type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Output Shaft Material"
              value={formData.internals.output_shaft_material}
              onChange={(e) => handleInputChange('internals', 'output_shaft_material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Input Shaft Material"
              value={formData.internals.input_shaft_material}
              onChange={(e) => handleInputChange('internals', 'input_shaft_material', e.target.value)}
            />
            <input
              type="text"
              placeholder="Bearing Upgrades"
              value={formData.internals.bearing_upgrades}
              onChange={(e) => handleInputChange('internals', 'bearing_upgrades', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.internals.notes}
            onChange={(e) => handleInputChange('internals', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Cooling System */}
        <section className="editor-section">
          <div className="section-header">
            <h3>Cooling System</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files && handleFileSelect('trans_cooler', e.target.files[0])}
            />
          </div>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Cooler Type (stock, external)"
              value={formData.cooling.cooler_type}
              onChange={(e) => handleInputChange('cooling', 'cooler_type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Cooler Manufacturer"
              value={formData.cooling.cooler_manufacturer}
              onChange={(e) => handleInputChange('cooling', 'cooler_manufacturer', e.target.value)}
            />
            <input
              type="text"
              placeholder="Cooler Location"
              value={formData.cooling.cooler_location}
              onChange={(e) => handleInputChange('cooling', 'cooler_location', e.target.value)}
            />
            <input
              type="text"
              placeholder="Line Size (in)"
              value={formData.cooling.line_size}
              onChange={(e) => handleInputChange('cooling', 'line_size', e.target.value)}
            />
          </div>
          <textarea
            placeholder="Notes"
            value={formData.cooling.notes}
            onChange={(e) => handleInputChange('cooling', 'notes', e.target.value)}
            rows={2}
          />
        </section>

        {/* Transmission Fluid */}
        <section className="editor-section">
          <h3>Transmission Fluid</h3>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Type (e.g., Dexron VI, ATF+4)"
              value={formData.fluid.type}
              onChange={(e) => handleInputChange('fluid', 'type', e.target.value)}
            />
            <input
              type="text"
              placeholder="Capacity (quarts)"
              value={formData.fluid.capacity}
              onChange={(e) => handleInputChange('fluid', 'capacity', e.target.value)}
            />
            <input
              type="date"
              placeholder="Last Changed"
              value={formData.fluid.last_changed}
              onChange={(e) => handleInputChange('fluid', 'last_changed', e.target.value)}
            />
            <input
              type="text"
              placeholder="Filter Type"
              value={formData.fluid.filter_type}
              onChange={(e) => handleInputChange('fluid', 'filter_type', e.target.value)}
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
            {isSaving ? 'Saving...' : 'Save Transmission'}
          </button>
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isSaving}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <style>{`
        .transmission-editor {
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

        .section-header h3 {
          margin: 0;
        }

        .section-header input[type="file"] {
          font-size: 0.875rem;
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
