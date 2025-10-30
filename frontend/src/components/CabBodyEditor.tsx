import React, { useState, useEffect } from 'react';
import { Build } from '../services/api';

interface CabBodyEditorProps {
  buildData: Build;
  onChange: (data: Partial<Build>) => void;
}

export const CabBodyEditor: React.FC<CabBodyEditorProps> = ({ buildData, onChange }) => {
  // Parse cab_interior_json if it exists - it stores both interior and exterior
  const cabData = buildData.cab_interior_json || {
    interior: {},
    exterior: {}
  };

  const [formData, setFormData] = useState({
    // Interior
    seats_type: cabData.interior?.seats_type || '',
    seats_brand: cabData.interior?.seats_brand || '',
    seats_model: cabData.interior?.seats_model || '',
    gauges_dash: cabData.interior?.gauges_dash || '',
    gauges_cluster: cabData.interior?.gauges_cluster || '',
    steering_wheel: cabData.interior?.steering_wheel || '',
    hvac_system: cabData.interior?.hvac_system || '',
    sound_system: cabData.interior?.sound_system || '',
    roll_cage: cabData.interior?.roll_cage || '',
    safety_equipment: cabData.interior?.safety_equipment || '',

    // Exterior
    headlights: cabData.exterior?.headlights || '',
    fog_lights: cabData.exterior?.fog_lights || '',
    taillights: cabData.exterior?.taillights || '',
    front_bumper: cabData.exterior?.front_bumper || '',
    rear_bumper: cabData.exterior?.rear_bumper || '',
    tow_hooks: cabData.exterior?.tow_hooks || '',
    side_steps: cabData.exterior?.side_steps || '',
    bed_liner: cabData.exterior?.bed_liner || '',
    grille: cabData.exterior?.grille || '',
    hood: cabData.exterior?.hood || '',
    fenders: cabData.exterior?.fenders || '',
    paint_wrap: cabData.exterior?.paint_wrap || ''
  });

  useEffect(() => {
    // Convert flat form data back to nested JSON structure
    const cab_interior_json = {
      interior: {
        seats_type: formData.seats_type,
        seats_brand: formData.seats_brand,
        seats_model: formData.seats_model,
        gauges_dash: formData.gauges_dash,
        gauges_cluster: formData.gauges_cluster,
        steering_wheel: formData.steering_wheel,
        hvac_system: formData.hvac_system,
        sound_system: formData.sound_system,
        roll_cage: formData.roll_cage,
        safety_equipment: formData.safety_equipment
      },
      exterior: {
        headlights: formData.headlights,
        fog_lights: formData.fog_lights,
        taillights: formData.taillights,
        front_bumper: formData.front_bumper,
        rear_bumper: formData.rear_bumper,
        tow_hooks: formData.tow_hooks,
        side_steps: formData.side_steps,
        bed_liner: formData.bed_liner,
        grille: formData.grille,
        hood: formData.hood,
        fenders: formData.fenders,
        paint_wrap: formData.paint_wrap
      }
    };

    onChange({ cab_interior_json });
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const seatTypes = [
    'Stock',
    'Sport Bucket',
    'Racing Bucket',
    'Racing Harness',
    'Bench Seat',
    'Custom'
  ];

  const lightTypes = [
    'Stock',
    'LED',
    'HID/Xenon',
    'Halo',
    'Projector',
    'Custom'
  ];

  return (
    <div className="cab-body-editor">
      <div className="editor-header">
        <h2>Cab & Body</h2>
        <p className="editor-subtitle">Interior and exterior components</p>
      </div>

      <div className="editor-form">
        {/* Interior Section */}
        <section className="cab-section">
          <div className="section-title">
            <h3>Interior</h3>
          </div>

          <div className="subsection">
            <h4>Seats</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="seats_type">Seat Type</label>
                <select
                  id="seats_type"
                  name="seats_type"
                  value={formData.seats_type}
                  onChange={handleChange}
                >
                  <option value="">Select type...</option>
                  {seatTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="seats_brand">Brand</label>
                <input
                  type="text"
                  id="seats_brand"
                  name="seats_brand"
                  value={formData.seats_brand}
                  onChange={handleChange}
                  placeholder="e.g., Recaro, Sparco"
                />
              </div>
              <div className="form-group">
                <label htmlFor="seats_model">Model</label>
                <input
                  type="text"
                  id="seats_model"
                  name="seats_model"
                  value={formData.seats_model}
                  onChange={handleChange}
                  placeholder="Model or part number"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4>Gauges & Instruments</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="gauges_dash">Dashboard/Gauge Panel</label>
                <input
                  type="text"
                  id="gauges_dash"
                  name="gauges_dash"
                  value={formData.gauges_dash}
                  onChange={handleChange}
                  placeholder="e.g., Holley Digital Dash"
                />
              </div>
              <div className="form-group">
                <label htmlFor="gauges_cluster">Gauge Cluster</label>
                <input
                  type="text"
                  id="gauges_cluster"
                  name="gauges_cluster"
                  value={formData.gauges_cluster}
                  onChange={handleChange}
                  placeholder="e.g., Auto Meter"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4>Other Interior Components</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="steering_wheel">Steering Wheel</label>
                <input
                  type="text"
                  id="steering_wheel"
                  name="steering_wheel"
                  value={formData.steering_wheel}
                  onChange={handleChange}
                  placeholder="e.g., Grant 3-spoke"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hvac_system">HVAC System</label>
                <input
                  type="text"
                  id="hvac_system"
                  name="hvac_system"
                  value={formData.hvac_system}
                  onChange={handleChange}
                  placeholder="e.g., Vintage Air"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sound_system">Sound System</label>
                <input
                  type="text"
                  id="sound_system"
                  name="sound_system"
                  value={formData.sound_system}
                  onChange={handleChange}
                  placeholder="Stereo, speakers, amp"
                />
              </div>
              <div className="form-group">
                <label htmlFor="roll_cage">Roll Cage/Bar</label>
                <input
                  type="text"
                  id="roll_cage"
                  name="roll_cage"
                  value={formData.roll_cage}
                  onChange={handleChange}
                  placeholder="e.g., 6-point chromoly"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="safety_equipment">Safety Equipment</label>
                <textarea
                  id="safety_equipment"
                  name="safety_equipment"
                  value={formData.safety_equipment}
                  onChange={handleChange}
                  placeholder="Harnesses, fire suppression, window net, etc."
                  rows={2}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Exterior Section */}
        <section className="cab-section">
          <div className="section-title">
            <h3>Exterior</h3>
          </div>

          <div className="subsection">
            <h4>Lighting</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="headlights">Headlights</label>
                <select
                  id="headlights"
                  name="headlights"
                  value={formData.headlights}
                  onChange={handleChange}
                >
                  <option value="">Select type...</option>
                  {lightTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="fog_lights">Fog Lights</label>
                <input
                  type="text"
                  id="fog_lights"
                  name="fog_lights"
                  value={formData.fog_lights}
                  onChange={handleChange}
                  placeholder="e.g., Rigid Industries D-SS"
                />
              </div>
              <div className="form-group">
                <label htmlFor="taillights">Taillights</label>
                <input
                  type="text"
                  id="taillights"
                  name="taillights"
                  value={formData.taillights}
                  onChange={handleChange}
                  placeholder="e.g., LED custom"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4>Body Panels & Bumpers</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="front_bumper">Front Bumper</label>
                <input
                  type="text"
                  id="front_bumper"
                  name="front_bumper"
                  value={formData.front_bumper}
                  onChange={handleChange}
                  placeholder="e.g., Ranch Hand, custom"
                />
              </div>
              <div className="form-group">
                <label htmlFor="rear_bumper">Rear Bumper</label>
                <input
                  type="text"
                  id="rear_bumper"
                  name="rear_bumper"
                  value={formData.rear_bumper}
                  onChange={handleChange}
                  placeholder="e.g., Chassis Unlimited"
                />
              </div>
              <div className="form-group">
                <label htmlFor="grille">Grille</label>
                <input
                  type="text"
                  id="grille"
                  name="grille"
                  value={formData.grille}
                  onChange={handleChange}
                  placeholder="e.g., Billet, mesh"
                />
              </div>
              <div className="form-group">
                <label htmlFor="hood">Hood</label>
                <input
                  type="text"
                  id="hood"
                  name="hood"
                  value={formData.hood}
                  onChange={handleChange}
                  placeholder="e.g., Cowl induction, shaker"
                />
              </div>
              <div className="form-group">
                <label htmlFor="fenders">Fenders</label>
                <input
                  type="text"
                  id="fenders"
                  name="fenders"
                  value={formData.fenders}
                  onChange={handleChange}
                  placeholder="e.g., Flared, tubbed"
                />
              </div>
            </div>
          </div>

          <div className="subsection">
            <h4>Accessories & Finish</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tow_hooks">Tow Hooks</label>
                <input
                  type="text"
                  id="tow_hooks"
                  name="tow_hooks"
                  value={formData.tow_hooks}
                  onChange={handleChange}
                  placeholder="e.g., Front/rear, brand"
                />
              </div>
              <div className="form-group">
                <label htmlFor="side_steps">Side Steps/Running Boards</label>
                <input
                  type="text"
                  id="side_steps"
                  name="side_steps"
                  value={formData.side_steps}
                  onChange={handleChange}
                  placeholder="e.g., Westin, nerf bars"
                />
              </div>
              <div className="form-group">
                <label htmlFor="bed_liner">Bed Liner (if truck)</label>
                <input
                  type="text"
                  id="bed_liner"
                  name="bed_liner"
                  value={formData.bed_liner}
                  onChange={handleChange}
                  placeholder="e.g., Line-X, spray-in"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="paint_wrap">Paint/Wrap</label>
                <input
                  type="text"
                  id="paint_wrap"
                  name="paint_wrap"
                  value={formData.paint_wrap}
                  onChange={handleChange}
                  placeholder="e.g., PPG Black, 3M wrap, color code"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .cab-body-editor {
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
          gap: 40px;
        }

        .cab-section {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 24px;
        }

        .section-title {
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 2px solid #4c51bf;
        }

        .section-title h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #4c51bf;
        }

        .subsection {
          margin-bottom: 28px;
        }

        .subsection:last-child {
          margin-bottom: 0;
        }

        .subsection h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 16px;
          padding-left: 8px;
          border-left: 3px solid #cbd5e0;
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
        .form-group select,
        .form-group textarea {
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9375rem;
          transition: border-color 0.2s, box-shadow 0.2s;
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

        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
