import React, { useState, useEffect } from 'react';
import { Build } from '../services/api';

interface EngineSpecsEditorProps {
  buildData: Build;
  onChange: (data: Partial<Build>) => void;
}

export const EngineSpecsEditor: React.FC<EngineSpecsEditorProps> = ({ buildData, onChange }) => {
  const [formData, setFormData] = useState({
    // Basic Engine Dimensions
    displacement_ci: buildData.displacement_ci || '',
    bore_in: buildData.bore_in || '',
    stroke_in: buildData.stroke_in || '',
    rod_len_in: buildData.rod_len_in || '',

    // Compression Components
    deck_clear_in: buildData.deck_clear_in || '',
    piston_cc: buildData.piston_cc || '',
    chamber_cc: buildData.chamber_cc || '',
    gasket_bore_in: buildData.gasket_bore_in || '',
    gasket_thickness_in: buildData.gasket_thickness_in || '',
    quench_in: buildData.quench_in || '',

    // Compression Ratios
    static_cr: buildData.static_cr || '',
    dynamic_cr: buildData.dynamic_cr || '',

    // Engine Balance & Identification
    balance_oz: buildData.balance_oz || '',
    flywheel_teeth: buildData.flywheel_teeth || '',
    firing_order: buildData.firing_order || '',

    // Camshaft Specifications
    camshaft_model: buildData.camshaft_model || '',
    camshaft_duration_int: buildData.camshaft_duration_int || '',
    camshaft_duration_exh: buildData.camshaft_duration_exh || '',
    camshaft_lift_int: buildData.camshaft_lift_int || '',
    camshaft_lift_exh: buildData.camshaft_lift_exh || '',
    camshaft_lsa: buildData.camshaft_lsa || '',

    // Ring Gap Measurements
    ring_gap_top_in: buildData.ring_gap_top_in || '',
    ring_gap_second_in: buildData.ring_gap_second_in || '',
    ring_gap_oil_in: buildData.ring_gap_oil_in || '',

    // Bearing Clearances
    cam_bearing_clearance_in: buildData.cam_bearing_clearance_in || ''
  });

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="engine-specs-editor">
      <div className="editor-header">
        <h2>Engine Specifications</h2>
        <p className="editor-subtitle">Core engine measurements and specifications</p>
      </div>

      <div className="editor-form">
        {/* Basic Engine Dimensions */}
        <section className="spec-section">
          <h3>Basic Dimensions</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="displacement_ci">Displacement (CI)</label>
              <input
                type="number"
                id="displacement_ci"
                name="displacement_ci"
                value={formData.displacement_ci}
                onChange={handleChange}
                placeholder="e.g., 350"
                step="0.01"
              />
              <span className="help-text">Cubic inches</span>
            </div>

            <div className="form-group">
              <label htmlFor="bore_in">Bore (inches)</label>
              <input
                type="number"
                id="bore_in"
                name="bore_in"
                value={formData.bore_in}
                onChange={handleChange}
                placeholder="e.g., 4.000"
                step="0.0001"
              />
              <span className="help-text">Cylinder diameter</span>
            </div>

            <div className="form-group">
              <label htmlFor="stroke_in">Stroke (inches)</label>
              <input
                type="number"
                id="stroke_in"
                name="stroke_in"
                value={formData.stroke_in}
                onChange={handleChange}
                placeholder="e.g., 3.480"
                step="0.0001"
              />
              <span className="help-text">Crankshaft throw</span>
            </div>

            <div className="form-group">
              <label htmlFor="rod_len_in">Rod Length (inches)</label>
              <input
                type="number"
                id="rod_len_in"
                name="rod_len_in"
                value={formData.rod_len_in}
                onChange={handleChange}
                placeholder="e.g., 5.700"
                step="0.0001"
              />
              <span className="help-text">Center to center</span>
            </div>
          </div>
        </section>

        {/* Compression Components */}
        <section className="spec-section">
          <h3>Compression Components</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="deck_clear_in">Deck Clearance (inches)</label>
              <input
                type="number"
                id="deck_clear_in"
                name="deck_clear_in"
                value={formData.deck_clear_in}
                onChange={handleChange}
                placeholder="e.g., 0.015"
                step="0.0001"
              />
              <span className="help-text">Piston to deck distance</span>
            </div>

            <div className="form-group">
              <label htmlFor="piston_cc">Piston Dome Volume (cc)</label>
              <input
                type="number"
                id="piston_cc"
                name="piston_cc"
                value={formData.piston_cc}
                onChange={handleChange}
                placeholder="e.g., -5.0 (dish) or 5.0 (dome)"
                step="0.01"
              />
              <span className="help-text">Negative = dish, Positive = dome</span>
            </div>

            <div className="form-group">
              <label htmlFor="chamber_cc">Chamber Volume (cc)</label>
              <input
                type="number"
                id="chamber_cc"
                name="chamber_cc"
                value={formData.chamber_cc}
                onChange={handleChange}
                placeholder="e.g., 64.0"
                step="0.01"
              />
              <span className="help-text">Combustion chamber size</span>
            </div>

            <div className="form-group">
              <label htmlFor="gasket_bore_in">Gasket Bore (inches)</label>
              <input
                type="number"
                id="gasket_bore_in"
                name="gasket_bore_in"
                value={formData.gasket_bore_in}
                onChange={handleChange}
                placeholder="e.g., 4.100"
                step="0.0001"
              />
              <span className="help-text">Head gasket opening</span>
            </div>

            <div className="form-group">
              <label htmlFor="gasket_thickness_in">Gasket Thickness (inches)</label>
              <input
                type="number"
                id="gasket_thickness_in"
                name="gasket_thickness_in"
                value={formData.gasket_thickness_in}
                onChange={handleChange}
                placeholder="e.g., 0.040"
                step="0.0001"
              />
              <span className="help-text">Compressed thickness</span>
            </div>

            <div className="form-group">
              <label htmlFor="quench_in">Quench Distance (inches)</label>
              <input
                type="number"
                id="quench_in"
                name="quench_in"
                value={formData.quench_in}
                onChange={handleChange}
                placeholder="e.g., 0.035"
                step="0.0001"
              />
              <span className="help-text">Piston-to-head clearance</span>
            </div>
          </div>
        </section>

        {/* Compression Ratios */}
        <section className="spec-section">
          <h3>Compression Ratios</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="static_cr">Static Compression Ratio</label>
              <input
                type="number"
                id="static_cr"
                name="static_cr"
                value={formData.static_cr}
                onChange={handleChange}
                placeholder="e.g., 9.5"
                step="0.01"
              />
              <span className="help-text">Calculated or measured</span>
            </div>

            <div className="form-group">
              <label htmlFor="dynamic_cr">Dynamic Compression Ratio</label>
              <input
                type="number"
                id="dynamic_cr"
                name="dynamic_cr"
                value={formData.dynamic_cr}
                onChange={handleChange}
                placeholder="e.g., 8.2"
                step="0.01"
              />
              <span className="help-text">With cam timing considered</span>
            </div>
          </div>
        </section>

        {/* Engine Balance & Identification */}
        <section className="spec-section">
          <h3>Balance & Identification</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="balance_oz">Balance Weight (oz-in)</label>
              <input
                type="number"
                id="balance_oz"
                name="balance_oz"
                value={formData.balance_oz}
                onChange={handleChange}
                placeholder="e.g., 50.0"
                step="0.01"
              />
              <span className="help-text">External balance weight</span>
            </div>

            <div className="form-group">
              <label htmlFor="flywheel_teeth">Flywheel Teeth</label>
              <input
                type="number"
                id="flywheel_teeth"
                name="flywheel_teeth"
                value={formData.flywheel_teeth}
                onChange={handleChange}
                placeholder="e.g., 168 or 153"
              />
              <span className="help-text">Ring gear tooth count</span>
            </div>

            <div className="form-group">
              <label htmlFor="firing_order">Firing Order</label>
              <input
                type="text"
                id="firing_order"
                name="firing_order"
                value={formData.firing_order}
                onChange={handleChange}
                placeholder="e.g., 1-8-4-3-6-5-7-2"
              />
              <span className="help-text">Cylinder firing sequence</span>
            </div>
          </div>
        </section>

        {/* Camshaft Specifications */}
        <section className="spec-section">
          <h3>Camshaft Specifications</h3>
          <div className="form-group full-width">
            <label htmlFor="camshaft_model">Camshaft Model</label>
            <input
              type="text"
              id="camshaft_model"
              name="camshaft_model"
              value={formData.camshaft_model}
              onChange={handleChange}
              placeholder="e.g., Comp Cams XE268H"
            />
            <span className="help-text">Manufacturer and model number</span>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="camshaft_duration_int">Intake Duration</label>
              <input
                type="text"
                id="camshaft_duration_int"
                name="camshaft_duration_int"
                value={formData.camshaft_duration_int}
                onChange={handleChange}
                placeholder="e.g., 268° @ 0.050 in"
              />
              <span className="help-text">Advertised or @ 0.050"</span>
            </div>

            <div className="form-group">
              <label htmlFor="camshaft_duration_exh">Exhaust Duration</label>
              <input
                type="text"
                id="camshaft_duration_exh"
                name="camshaft_duration_exh"
                value={formData.camshaft_duration_exh}
                onChange={handleChange}
                placeholder="e.g., 272° @ 0.050 in"
              />
              <span className="help-text">Advertised or @ 0.050"</span>
            </div>

            <div className="form-group">
              <label htmlFor="camshaft_lift_int">Intake Lift (inches)</label>
              <input
                type="number"
                id="camshaft_lift_int"
                name="camshaft_lift_int"
                value={formData.camshaft_lift_int}
                onChange={handleChange}
                placeholder="e.g., 0.477"
                step="0.0001"
              />
              <span className="help-text">At valve with rocker ratio</span>
            </div>

            <div className="form-group">
              <label htmlFor="camshaft_lift_exh">Exhaust Lift (inches)</label>
              <input
                type="number"
                id="camshaft_lift_exh"
                name="camshaft_lift_exh"
                value={formData.camshaft_lift_exh}
                onChange={handleChange}
                placeholder="e.g., 0.480"
                step="0.0001"
              />
              <span className="help-text">At valve with rocker ratio</span>
            </div>

            <div className="form-group">
              <label htmlFor="camshaft_lsa">Lobe Separation Angle (degrees)</label>
              <input
                type="number"
                id="camshaft_lsa"
                name="camshaft_lsa"
                value={formData.camshaft_lsa}
                onChange={handleChange}
                placeholder="e.g., 110"
                step="0.01"
              />
              <span className="help-text">LSA in degrees</span>
            </div>
          </div>
        </section>

        {/* Ring Gap Measurements */}
        <section className="spec-section">
          <h3>Piston Ring Gap Measurements</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ring_gap_top_in">Top Ring Gap (inches)</label>
              <input
                type="number"
                id="ring_gap_top_in"
                name="ring_gap_top_in"
                value={formData.ring_gap_top_in}
                onChange={handleChange}
                placeholder="e.g., 0.016"
                step="0.0001"
              />
              <span className="help-text">Compression ring #1</span>
            </div>

            <div className="form-group">
              <label htmlFor="ring_gap_second_in">Second Ring Gap (inches)</label>
              <input
                type="number"
                id="ring_gap_second_in"
                name="ring_gap_second_in"
                value={formData.ring_gap_second_in}
                onChange={handleChange}
                placeholder="e.g., 0.018"
                step="0.0001"
              />
              <span className="help-text">Compression ring #2</span>
            </div>

            <div className="form-group">
              <label htmlFor="ring_gap_oil_in">Oil Ring Gap (inches)</label>
              <input
                type="number"
                id="ring_gap_oil_in"
                name="ring_gap_oil_in"
                value={formData.ring_gap_oil_in}
                onChange={handleChange}
                placeholder="e.g., 0.015"
                step="0.0001"
              />
              <span className="help-text">Oil control ring</span>
            </div>
          </div>
        </section>

        {/* Bearing Clearances */}
        <section className="spec-section">
          <h3>Bearing Clearances</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="cam_bearing_clearance_in">Cam Bearing Clearance (inches)</label>
              <input
                type="number"
                id="cam_bearing_clearance_in"
                name="cam_bearing_clearance_in"
                value={formData.cam_bearing_clearance_in}
                onChange={handleChange}
                placeholder="e.g., 0.0025"
                step="0.0001"
              />
              <span className="help-text">Camshaft journal clearance</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .engine-specs-editor {
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

        .spec-section {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
        }

        .spec-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
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
