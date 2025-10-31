import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { buildsAPI } from '../services/api';
import type { BuildDetail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MaintenanceRecordModal } from '../components/MaintenanceRecordModal';
import { ComponentNotes } from '../components/ComponentNotes';

export const BuildDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    use_type: '',
    fuel_type: '',
    notes: '',

    // Performance Targets
    target_hp: '',
    target_torque: '',
    rev_limit_rpm: '',

    // Engine Specs
    displacement_ci: '',
    bore_in: '',
    stroke_in: '',
    rod_len_in: '',
    deck_clear_in: '',
    piston_cc: '',
    chamber_cc: '',
    gasket_bore_in: '',
    gasket_thickness_in: '',
    quench_in: '',
    static_cr: '',
    dynamic_cr: '',
    balance_oz: '',
    flywheel_teeth: '',
    firing_order: '',

    // Camshaft Specs
    camshaft_model: '',
    camshaft_duration_int: '',
    camshaft_duration_exh: '',
    camshaft_lift_int: '',
    camshaft_lift_exh: '',
    camshaft_lsa: '',

    // Ring Gap Measurements
    ring_gap_top_in: '',
    ring_gap_second_in: '',
    ring_gap_oil_in: '',

    // Bearing Clearances
    cam_bearing_clearance_in: '',

    // Vehicle Information
    vehicle_year: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_trim: '',
    vin: '',
    vehicle_weight_lbs: '',

    // Transmission
    transmission_type: '',
    transmission_model: '',
    transmission_gears: '',
    final_drive_ratio: '',

    // Suspension & Handling
    suspension_front: '',
    suspension_rear: '',
    spring_rate_front: '',
    spring_rate_rear: '',
    sway_bar_front: '',
    sway_bar_rear: '',

    // Tires & Wheels
    tire_size_front: '',
    tire_size_rear: '',
    tire_brand: '',
    tire_model: '',
    wheel_size_front: '',
    wheel_size_rear: '',

    // Fluids & Lubricants
    engine_oil_type: '',
    engine_oil_weight: '',
    engine_oil_capacity: '',
    transmission_fluid_type: '',
    differential_fluid_type: '',
    coolant_type: ''
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id === 'new') {
      setIsCreating(true);
      setLoading(false);
    } else if (id) {
      loadBuild(id);
    }
  }, [id]);

  const loadBuild = async (buildIdentifier: string) => {
    try {
      const data = await buildsAPI.getById(buildIdentifier);
      setBuild(data);
    } catch (err: any) {
      setError('Failed to load build details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const buildData: any = {
        name: formData.name,
        use_type: formData.use_type || null,
        fuel_type: formData.fuel_type || null,
        notes: formData.notes || null
      };

      // Performance Targets
      if (formData.target_hp) buildData.target_hp = parseFloat(formData.target_hp);
      if (formData.target_torque) buildData.target_torque = parseFloat(formData.target_torque);
      if (formData.rev_limit_rpm) buildData.rev_limit_rpm = parseInt(formData.rev_limit_rpm);

      // Engine Specs
      if (formData.displacement_ci) buildData.displacement_ci = parseFloat(formData.displacement_ci);
      if (formData.bore_in) buildData.bore_in = parseFloat(formData.bore_in);
      if (formData.stroke_in) buildData.stroke_in = parseFloat(formData.stroke_in);
      if (formData.rod_len_in) buildData.rod_len_in = parseFloat(formData.rod_len_in);
      if (formData.deck_clear_in) buildData.deck_clear_in = parseFloat(formData.deck_clear_in);
      if (formData.piston_cc) buildData.piston_cc = parseFloat(formData.piston_cc);
      if (formData.chamber_cc) buildData.chamber_cc = parseFloat(formData.chamber_cc);
      if (formData.gasket_bore_in) buildData.gasket_bore_in = parseFloat(formData.gasket_bore_in);
      if (formData.gasket_thickness_in) buildData.gasket_thickness_in = parseFloat(formData.gasket_thickness_in);
      if (formData.quench_in) buildData.quench_in = parseFloat(formData.quench_in);
      if (formData.static_cr) buildData.static_cr = parseFloat(formData.static_cr);
      if (formData.dynamic_cr) buildData.dynamic_cr = parseFloat(formData.dynamic_cr);
      if (formData.balance_oz) buildData.balance_oz = parseFloat(formData.balance_oz);
      if (formData.flywheel_teeth) buildData.flywheel_teeth = parseInt(formData.flywheel_teeth);
      if (formData.firing_order) buildData.firing_order = formData.firing_order;

      // Camshaft Specs
      if (formData.camshaft_model) buildData.camshaft_model = formData.camshaft_model;
      if (formData.camshaft_duration_int) buildData.camshaft_duration_int = formData.camshaft_duration_int;
      if (formData.camshaft_duration_exh) buildData.camshaft_duration_exh = formData.camshaft_duration_exh;
      if (formData.camshaft_lift_int) buildData.camshaft_lift_int = parseFloat(formData.camshaft_lift_int);
      if (formData.camshaft_lift_exh) buildData.camshaft_lift_exh = parseFloat(formData.camshaft_lift_exh);
      if (formData.camshaft_lsa) buildData.camshaft_lsa = parseFloat(formData.camshaft_lsa);

      // Ring Gap Measurements
      if (formData.ring_gap_top_in) buildData.ring_gap_top_in = parseFloat(formData.ring_gap_top_in);
      if (formData.ring_gap_second_in) buildData.ring_gap_second_in = parseFloat(formData.ring_gap_second_in);
      if (formData.ring_gap_oil_in) buildData.ring_gap_oil_in = parseFloat(formData.ring_gap_oil_in);

      // Bearing Clearances
      if (formData.cam_bearing_clearance_in) buildData.cam_bearing_clearance_in = parseFloat(formData.cam_bearing_clearance_in);

      // Vehicle Information
      if (formData.vehicle_year) buildData.vehicle_year = parseInt(formData.vehicle_year);
      if (formData.vehicle_make) buildData.vehicle_make = formData.vehicle_make;
      if (formData.vehicle_model) buildData.vehicle_model = formData.vehicle_model;
      if (formData.vehicle_trim) buildData.vehicle_trim = formData.vehicle_trim;
      if (formData.vin) buildData.vin = formData.vin;
      if (formData.vehicle_weight_lbs) buildData.vehicle_weight_lbs = parseFloat(formData.vehicle_weight_lbs);

      // Transmission
      if (formData.transmission_type) buildData.transmission_type = formData.transmission_type;
      if (formData.transmission_model) buildData.transmission_model = formData.transmission_model;
      if (formData.transmission_gears) buildData.transmission_gears = parseInt(formData.transmission_gears);
      if (formData.final_drive_ratio) buildData.final_drive_ratio = formData.final_drive_ratio;

      // Suspension & Handling
      if (formData.suspension_front) buildData.suspension_front = formData.suspension_front;
      if (formData.suspension_rear) buildData.suspension_rear = formData.suspension_rear;
      if (formData.spring_rate_front) buildData.spring_rate_front = formData.spring_rate_front;
      if (formData.spring_rate_rear) buildData.spring_rate_rear = formData.spring_rate_rear;
      if (formData.sway_bar_front) buildData.sway_bar_front = formData.sway_bar_front;
      if (formData.sway_bar_rear) buildData.sway_bar_rear = formData.sway_bar_rear;

      // Tires & Wheels
      if (formData.tire_size_front) buildData.tire_size_front = formData.tire_size_front;
      if (formData.tire_size_rear) buildData.tire_size_rear = formData.tire_size_rear;
      if (formData.tire_brand) buildData.tire_brand = formData.tire_brand;
      if (formData.tire_model) buildData.tire_model = formData.tire_model;
      if (formData.wheel_size_front) buildData.wheel_size_front = formData.wheel_size_front;
      if (formData.wheel_size_rear) buildData.wheel_size_rear = formData.wheel_size_rear;

      // Fluids & Lubricants
      if (formData.engine_oil_type) buildData.engine_oil_type = formData.engine_oil_type;
      if (formData.engine_oil_weight) buildData.engine_oil_weight = formData.engine_oil_weight;
      if (formData.engine_oil_capacity) buildData.engine_oil_capacity = formData.engine_oil_capacity;
      if (formData.transmission_fluid_type) buildData.transmission_fluid_type = formData.transmission_fluid_type;
      if (formData.differential_fluid_type) buildData.differential_fluid_type = formData.differential_fluid_type;
      if (formData.coolant_type) buildData.coolant_type = formData.coolant_type;

      await buildsAPI.create(buildData);
      // Navigate back to builds list
      navigate('/builds');
    } catch (err: any) {
      setError('Failed to create build');
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEditMaintenance = (record: any) => {
    setEditingMaintenance(record);
    setShowMaintenanceModal(true);
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (isCreating) {
    return (
      <div className="container">
        <header className="page-header">
          <div>
            <Link to="/builds" className="back-link">
              ← Back to Builds
            </Link>
            <h1>Create New Build</h1>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleCreateBuild} className="build-form">
          {/* Basic Info Section */}
          <section className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Build Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 350 Small Block Street Build"
                />
              </div>

              <div className="form-group">
                <label htmlFor="use_type">Use Type</label>
                <input
                  type="text"
                  id="use_type"
                  name="use_type"
                  value={formData.use_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Street, Race, Street/Strip"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fuel_type">Fuel Type</label>
                <input
                  type="text"
                  id="fuel_type"
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Pump Gas, E85, Race Gas"
                />
              </div>
            </div>
          </section>

          {/* Performance Targets Section */}
          <section className="form-section">
            <h3>Performance Targets</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="target_hp">Target Horsepower</label>
                <input
                  type="number"
                  id="target_hp"
                  name="target_hp"
                  value={formData.target_hp}
                  onChange={handleInputChange}
                  placeholder="e.g., 400"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="target_torque">Target Torque (lb-ft)</label>
                <input
                  type="number"
                  id="target_torque"
                  name="target_torque"
                  value={formData.target_torque}
                  onChange={handleInputChange}
                  placeholder="e.g., 450"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rev_limit_rpm">Rev Limit (RPM)</label>
                <input
                  type="number"
                  id="rev_limit_rpm"
                  name="rev_limit_rpm"
                  value={formData.rev_limit_rpm}
                  onChange={handleInputChange}
                  placeholder="e.g., 6500"
                />
              </div>
            </div>
          </section>

          {/* Engine Specifications Section */}
          <section className="form-section">
            <h3>Engine Specifications</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="displacement_ci">Displacement (CI)</label>
                <input
                  type="number"
                  id="displacement_ci"
                  name="displacement_ci"
                  value={formData.displacement_ci}
                  onChange={handleInputChange}
                  placeholder="e.g., 350"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bore_in">Bore (inches)</label>
                <input
                  type="number"
                  id="bore_in"
                  name="bore_in"
                  value={formData.bore_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 4.000"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="stroke_in">Stroke (inches)</label>
                <input
                  type="number"
                  id="stroke_in"
                  name="stroke_in"
                  value={formData.stroke_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 3.480"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="rod_len_in">Rod Length (inches)</label>
                <input
                  type="number"
                  id="rod_len_in"
                  name="rod_len_in"
                  value={formData.rod_len_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 5.700"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="deck_clear_in">Deck Clearance (inches)</label>
                <input
                  type="number"
                  id="deck_clear_in"
                  name="deck_clear_in"
                  value={formData.deck_clear_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.015"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="piston_cc">Piston Dome (cc)</label>
                <input
                  type="number"
                  id="piston_cc"
                  name="piston_cc"
                  value={formData.piston_cc}
                  onChange={handleInputChange}
                  placeholder="e.g., -5.0 (dish) or 5.0 (dome)"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="chamber_cc">Chamber Volume (cc)</label>
                <input
                  type="number"
                  id="chamber_cc"
                  name="chamber_cc"
                  value={formData.chamber_cc}
                  onChange={handleInputChange}
                  placeholder="e.g., 64.0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gasket_bore_in">Gasket Bore (inches)</label>
                <input
                  type="number"
                  id="gasket_bore_in"
                  name="gasket_bore_in"
                  value={formData.gasket_bore_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 4.100"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gasket_thickness_in">Gasket Thickness (inches)</label>
                <input
                  type="number"
                  id="gasket_thickness_in"
                  name="gasket_thickness_in"
                  value={formData.gasket_thickness_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.040"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="quench_in">Quench (inches)</label>
                <input
                  type="number"
                  id="quench_in"
                  name="quench_in"
                  value={formData.quench_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.035"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="static_cr">Static Compression Ratio</label>
                <input
                  type="number"
                  id="static_cr"
                  name="static_cr"
                  value={formData.static_cr}
                  onChange={handleInputChange}
                  placeholder="e.g., 9.5"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dynamic_cr">Dynamic Compression Ratio</label>
                <input
                  type="number"
                  id="dynamic_cr"
                  name="dynamic_cr"
                  value={formData.dynamic_cr}
                  onChange={handleInputChange}
                  placeholder="e.g., 8.2"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="balance_oz">Balance (oz-in)</label>
                <input
                  type="number"
                  id="balance_oz"
                  name="balance_oz"
                  value={formData.balance_oz}
                  onChange={handleInputChange}
                  placeholder="e.g., 50.0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="flywheel_teeth">Flywheel Teeth</label>
                <input
                  type="number"
                  id="flywheel_teeth"
                  name="flywheel_teeth"
                  value={formData.flywheel_teeth}
                  onChange={handleInputChange}
                  placeholder="e.g., 168 or 153"
                />
              </div>

              <div className="form-group">
                <label htmlFor="firing_order">Firing Order</label>
                <input
                  type="text"
                  id="firing_order"
                  name="firing_order"
                  value={formData.firing_order}
                  onChange={handleInputChange}
                  placeholder="e.g., 1-8-4-3-6-5-7-2"
                />
              </div>
            </div>
          </section>

          {/* Camshaft Specifications Section */}
          <section className="form-section">
            <h3>Camshaft Specifications</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="camshaft_model">Camshaft Model</label>
                <input
                  type="text"
                  id="camshaft_model"
                  name="camshaft_model"
                  value={formData.camshaft_model}
                  onChange={handleInputChange}
                  placeholder="e.g., Comp Cams XE268H"
                />
              </div>

              <div className="form-group">
                <label htmlFor="camshaft_duration_int">Intake Duration</label>
                <input
                  type="text"
                  id="camshaft_duration_int"
                  name="camshaft_duration_int"
                  value={formData.camshaft_duration_int}
                  onChange={handleInputChange}
                  placeholder="e.g., 268° @ 0.050 in"
                />
              </div>

              <div className="form-group">
                <label htmlFor="camshaft_duration_exh">Exhaust Duration</label>
                <input
                  type="text"
                  id="camshaft_duration_exh"
                  name="camshaft_duration_exh"
                  value={formData.camshaft_duration_exh}
                  onChange={handleInputChange}
                  placeholder="e.g., 272° @ 0.050 in"
                />
              </div>

              <div className="form-group">
                <label htmlFor="camshaft_lift_int">Intake Lift (inches)</label>
                <input
                  type="number"
                  id="camshaft_lift_int"
                  name="camshaft_lift_int"
                  value={formData.camshaft_lift_int}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.477"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="camshaft_lift_exh">Exhaust Lift (inches)</label>
                <input
                  type="number"
                  id="camshaft_lift_exh"
                  name="camshaft_lift_exh"
                  value={formData.camshaft_lift_exh}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.480"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="camshaft_lsa">Lobe Separation Angle (LSA)</label>
                <input
                  type="number"
                  id="camshaft_lsa"
                  name="camshaft_lsa"
                  value={formData.camshaft_lsa}
                  onChange={handleInputChange}
                  placeholder="e.g., 110"
                  step="0.01"
                />
              </div>
            </div>
          </section>

          {/* Piston Ring Gap Measurements Section */}
          <section className="form-section">
            <h3>Piston Ring Gap Measurements</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="ring_gap_top_in">Top Ring Gap (inches)</label>
                <input
                  type="number"
                  id="ring_gap_top_in"
                  name="ring_gap_top_in"
                  value={formData.ring_gap_top_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.016"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ring_gap_second_in">Second Ring Gap (inches)</label>
                <input
                  type="number"
                  id="ring_gap_second_in"
                  name="ring_gap_second_in"
                  value={formData.ring_gap_second_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.018"
                  step="0.0001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="ring_gap_oil_in">Oil Ring Gap (inches)</label>
                <input
                  type="number"
                  id="ring_gap_oil_in"
                  name="ring_gap_oil_in"
                  value={formData.ring_gap_oil_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.015"
                  step="0.0001"
                />
              </div>
            </div>
          </section>

          {/* Bearing Clearances Section */}
          <section className="form-section">
            <h3>Bearing Clearances</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="cam_bearing_clearance_in">Cam Bearing Clearance (inches)</label>
                <input
                  type="number"
                  id="cam_bearing_clearance_in"
                  name="cam_bearing_clearance_in"
                  value={formData.cam_bearing_clearance_in}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.0025"
                  step="0.0001"
                />
              </div>
            </div>
          </section>

          {/* Vehicle Information Section */}
          <section className="form-section">
            <h3>Vehicle Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="vehicle_year">Year</label>
                <input
                  type="number"
                  id="vehicle_year"
                  name="vehicle_year"
                  value={formData.vehicle_year}
                  onChange={handleInputChange}
                  placeholder="e.g., 1969"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_make">Make</label>
                <input
                  type="text"
                  id="vehicle_make"
                  name="vehicle_make"
                  value={formData.vehicle_make}
                  onChange={handleInputChange}
                  placeholder="e.g., Chevrolet"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_model">Model</label>
                <input
                  type="text"
                  id="vehicle_model"
                  name="vehicle_model"
                  value={formData.vehicle_model}
                  onChange={handleInputChange}
                  placeholder="e.g., Camaro"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_trim">Trim</label>
                <input
                  type="text"
                  id="vehicle_trim"
                  name="vehicle_trim"
                  value={formData.vehicle_trim}
                  onChange={handleInputChange}
                  placeholder="e.g., SS"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vin">VIN</label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  placeholder="e.g., 124379N500001"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicle_weight_lbs">Weight (lbs)</label>
                <input
                  type="number"
                  id="vehicle_weight_lbs"
                  name="vehicle_weight_lbs"
                  value={formData.vehicle_weight_lbs}
                  onChange={handleInputChange}
                  placeholder="e.g., 3400"
                  step="0.01"
                />
              </div>
            </div>
          </section>

          {/* Transmission Section */}
          <section className="form-section">
            <h3>Transmission</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="transmission_type">Type</label>
                <input
                  type="text"
                  id="transmission_type"
                  name="transmission_type"
                  value={formData.transmission_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Manual, Automatic"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission_model">Model</label>
                <input
                  type="text"
                  id="transmission_model"
                  name="transmission_model"
                  value={formData.transmission_model}
                  onChange={handleInputChange}
                  placeholder="e.g., Muncie M21"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission_gears">Number of Gears</label>
                <input
                  type="number"
                  id="transmission_gears"
                  name="transmission_gears"
                  value={formData.transmission_gears}
                  onChange={handleInputChange}
                  placeholder="e.g., 4"
                />
              </div>

              <div className="form-group">
                <label htmlFor="final_drive_ratio">Final Drive Ratio</label>
                <input
                  type="text"
                  id="final_drive_ratio"
                  name="final_drive_ratio"
                  value={formData.final_drive_ratio}
                  onChange={handleInputChange}
                  placeholder="e.g., 3.73:1"
                />
              </div>
            </div>
          </section>

          {/* Suspension & Handling Section */}
          <section className="form-section">
            <h3>Suspension & Handling</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="suspension_front">Front Suspension</label>
                <input
                  type="text"
                  id="suspension_front"
                  name="suspension_front"
                  value={formData.suspension_front}
                  onChange={handleInputChange}
                  placeholder="e.g., Independent A-arm"
                />
              </div>

              <div className="form-group">
                <label htmlFor="suspension_rear">Rear Suspension</label>
                <input
                  type="text"
                  id="suspension_rear"
                  name="suspension_rear"
                  value={formData.suspension_rear}
                  onChange={handleInputChange}
                  placeholder="e.g., Solid axle with leaf springs"
                />
              </div>

              <div className="form-group">
                <label htmlFor="spring_rate_front">Front Spring Rate</label>
                <input
                  type="text"
                  id="spring_rate_front"
                  name="spring_rate_front"
                  value={formData.spring_rate_front}
                  onChange={handleInputChange}
                  placeholder="e.g., 400 lb/in"
                />
              </div>

              <div className="form-group">
                <label htmlFor="spring_rate_rear">Rear Spring Rate</label>
                <input
                  type="text"
                  id="spring_rate_rear"
                  name="spring_rate_rear"
                  value={formData.spring_rate_rear}
                  onChange={handleInputChange}
                  placeholder="e.g., 200 lb/in"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sway_bar_front">Front Sway Bar</label>
                <input
                  type="text"
                  id="sway_bar_front"
                  name="sway_bar_front"
                  value={formData.sway_bar_front}
                  onChange={handleInputChange}
                  placeholder="e.g., 1.25 inch"
                />
              </div>

              <div className="form-group">
                <label htmlFor="sway_bar_rear">Rear Sway Bar</label>
                <input
                  type="text"
                  id="sway_bar_rear"
                  name="sway_bar_rear"
                  value={formData.sway_bar_rear}
                  onChange={handleInputChange}
                  placeholder="e.g., 0.875 inch"
                />
              </div>
            </div>
          </section>

          {/* Tires & Wheels Section */}
          <section className="form-section">
            <h3>Tires & Wheels</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="tire_size_front">Front Tire Size</label>
                <input
                  type="text"
                  id="tire_size_front"
                  name="tire_size_front"
                  value={formData.tire_size_front}
                  onChange={handleInputChange}
                  placeholder="e.g., 245/45R17"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tire_size_rear">Rear Tire Size</label>
                <input
                  type="text"
                  id="tire_size_rear"
                  name="tire_size_rear"
                  value={formData.tire_size_rear}
                  onChange={handleInputChange}
                  placeholder="e.g., 275/40R17"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tire_brand">Tire Brand</label>
                <input
                  type="text"
                  id="tire_brand"
                  name="tire_brand"
                  value={formData.tire_brand}
                  onChange={handleInputChange}
                  placeholder="e.g., BFGoodrich"
                />
              </div>

              <div className="form-group">
                <label htmlFor="tire_model">Tire Model</label>
                <input
                  type="text"
                  id="tire_model"
                  name="tire_model"
                  value={formData.tire_model}
                  onChange={handleInputChange}
                  placeholder="e.g., g-Force Sport COMP-2"
                />
              </div>

              <div className="form-group">
                <label htmlFor="wheel_size_front">Front Wheel Size</label>
                <input
                  type="text"
                  id="wheel_size_front"
                  name="wheel_size_front"
                  value={formData.wheel_size_front}
                  onChange={handleInputChange}
                  placeholder="e.g., 17x8"
                />
              </div>

              <div className="form-group">
                <label htmlFor="wheel_size_rear">Rear Wheel Size</label>
                <input
                  type="text"
                  id="wheel_size_rear"
                  name="wheel_size_rear"
                  value={formData.wheel_size_rear}
                  onChange={handleInputChange}
                  placeholder="e.g., 17x9"
                />
              </div>
            </div>
          </section>

          {/* Fluids & Lubricants Section */}
          <section className="form-section">
            <h3>Fluids & Lubricants</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="engine_oil_type">Engine Oil Type</label>
                <input
                  type="text"
                  id="engine_oil_type"
                  name="engine_oil_type"
                  value={formData.engine_oil_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Synthetic"
                />
              </div>

              <div className="form-group">
                <label htmlFor="engine_oil_weight">Engine Oil Weight</label>
                <input
                  type="text"
                  id="engine_oil_weight"
                  name="engine_oil_weight"
                  value={formData.engine_oil_weight}
                  onChange={handleInputChange}
                  placeholder="e.g., 10W-30"
                />
              </div>

              <div className="form-group">
                <label htmlFor="engine_oil_capacity">Engine Oil Capacity</label>
                <input
                  type="text"
                  id="engine_oil_capacity"
                  name="engine_oil_capacity"
                  value={formData.engine_oil_capacity}
                  onChange={handleInputChange}
                  placeholder="e.g., 5 quarts"
                />
              </div>

              <div className="form-group">
                <label htmlFor="transmission_fluid_type">Transmission Fluid Type</label>
                <input
                  type="text"
                  id="transmission_fluid_type"
                  name="transmission_fluid_type"
                  value={formData.transmission_fluid_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Dexron VI"
                />
              </div>

              <div className="form-group">
                <label htmlFor="differential_fluid_type">Differential Fluid Type</label>
                <input
                  type="text"
                  id="differential_fluid_type"
                  name="differential_fluid_type"
                  value={formData.differential_fluid_type}
                  onChange={handleInputChange}
                  placeholder="e.g., 75W-90 GL-5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="coolant_type">Coolant Type</label>
                <input
                  type="text"
                  id="coolant_type"
                  name="coolant_type"
                  value={formData.coolant_type}
                  onChange={handleInputChange}
                  placeholder="e.g., Ethylene Glycol"
                />
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="form-section">
            <h3>Notes</h3>
            <div className="form-group">
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes about this build..."
                rows={4}
              />
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Create Build
            </button>
            <Link to="/builds" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="container">
        <div className="alert alert-error">{error || 'Build not found'}</div>
        <Link to="/builds" className="btn">
          Back to Builds
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <Link to="/builds" className="back-link">
            ← Back to Builds
          </Link>
          <h1>{build.name}</h1>
        </div>
        <div className="header-actions">
          {build.is_owner && (
            <Link to={`/builds/${build.slug}/edit`} className="btn btn-primary">
              Edit Build
            </Link>
          )}
          {user && (
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          )}
          {!user && (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </header>

      {!build.is_owner && (
        <div className="read-only-banner">
          <strong>Viewing shared build</strong>
          <span>You're viewing {build.first_name}'s build. {user ? 'You can view but not edit this build.' : 'Login to create your own builds.'}</span>
        </div>
      )}

      <div className="build-detail">
        {/* Build Summary */}
        <section className="detail-section build-summary">
          <h2>Build Summary</h2>
          <div className="summary-highlights">
            <div className="summary-card">
              <div className="summary-label">Vehicle</div>
              <div className="summary-value">
                {build.vehicle_year || build.vehicle_make || build.vehicle_model ? (
                  <>
                    {build.vehicle_year && <span>{build.vehicle_year} </span>}
                    {build.vehicle_make && <span>{build.vehicle_make} </span>}
                    {build.vehicle_model && <span>{build.vehicle_model}</span>}
                  </>
                ) : '—'}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Engine</div>
              <div className="summary-value">{build.displacement_ci ? `${build.displacement_ci} ci` : '—'}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Transmission</div>
              <div className="summary-value">
                {build.transmission_model || build.transmission_type || '—'}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Total Cost</div>
              <div className="summary-value">
                {(() => {
                  const engineTotal = (build.engine_parts || []).reduce((sum, part: any) =>
                    sum + (parseFloat(part.cost) || 0), 0);
                  const vehicleTotal = (build.vehicle_parts || []).reduce((sum, part: any) =>
                    sum + (parseFloat(part.cost) || 0), 0);
                  const total = engineTotal + vehicleTotal;
                  return total > 0 ? `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* Performance Targets */}
        <section className="detail-section">
          <h2>Performance Targets</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Target Horsepower</span>
              <span className="spec-value">{build.target_hp ? `${build.target_hp} hp` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Target Torque</span>
              <span className="spec-value">{build.target_torque ? `${build.target_torque} lb-ft` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rev Limit</span>
              <span className="spec-value">{build.rev_limit_rpm ? `${build.rev_limit_rpm} RPM` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Use Type</span>
              <span className="spec-value">{build.use_type || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Fuel Type</span>
              <span className="spec-value">{build.fuel_type || '—'}</span>
            </div>
          </div>
        </section>

        {/* Engine Specifications */}
        <section className="detail-section">
          <h2>Engine Specifications</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Displacement</span>
              <span className="spec-value">{build.displacement_ci ? `${build.displacement_ci} ci` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Bore</span>
              <span className="spec-value">{build.bore_in ? `${build.bore_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Stroke</span>
              <span className="spec-value">{build.stroke_in ? `${build.stroke_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rod Length</span>
              <span className="spec-value">{build.rod_len_in ? `${build.rod_len_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Deck Clearance</span>
              <span className="spec-value">{build.deck_clear_in ? `${build.deck_clear_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Piston Dome</span>
              <span className="spec-value">{build.piston_cc ? `${build.piston_cc} cc` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Chamber Volume</span>
              <span className="spec-value">{build.chamber_cc ? `${build.chamber_cc} cc` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Gasket Bore</span>
              <span className="spec-value">{build.gasket_bore_in ? `${build.gasket_bore_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Gasket Thickness</span>
              <span className="spec-value">{build.gasket_thickness_in ? `${build.gasket_thickness_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Quench</span>
              <span className="spec-value">{build.quench_in ? `${build.quench_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Static Compression Ratio</span>
              <span className="spec-value">{build.static_cr ? `${build.static_cr}:1` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Dynamic Compression Ratio</span>
              <span className="spec-value">{build.dynamic_cr ? `${build.dynamic_cr}:1` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Balance</span>
              <span className="spec-value">{build.balance_oz ? `${build.balance_oz} oz-in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Flywheel Teeth</span>
              <span className="spec-value">{build.flywheel_teeth || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Firing Order</span>
              <span className="spec-value">{build.firing_order || '—'}</span>
            </div>
          </div>
        </section>

        {/* Camshaft Specifications */}
        <section className="detail-section">
          <h2>Camshaft Specifications</h2>
          <div className="spec-item full-width">
            <span className="spec-label">Camshaft Model</span>
            <span className="spec-value">{build.camshaft_model || '—'}</span>
          </div>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Intake Duration</span>
              <span className="spec-value">{build.camshaft_duration_int || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Exhaust Duration</span>
              <span className="spec-value">{build.camshaft_duration_exh || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Intake Lift</span>
              <span className="spec-value">{build.camshaft_lift_int ? `${build.camshaft_lift_int} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Exhaust Lift</span>
              <span className="spec-value">{build.camshaft_lift_exh ? `${build.camshaft_lift_exh} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Lobe Separation Angle</span>
              <span className="spec-value">{build.camshaft_lsa ? `${build.camshaft_lsa}°` : '—'}</span>
            </div>
          </div>
        </section>

        {/* Piston Ring Gap Measurements */}
        <section className="detail-section">
          <h2>Piston Ring Gap Measurements</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Top Ring Gap</span>
              <span className="spec-value">{build.ring_gap_top_in ? `${build.ring_gap_top_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Second Ring Gap</span>
              <span className="spec-value">{build.ring_gap_second_in ? `${build.ring_gap_second_in} in` : '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Oil Ring Gap</span>
              <span className="spec-value">{build.ring_gap_oil_in ? `${build.ring_gap_oil_in} in` : '—'}</span>
            </div>
          </div>
        </section>

        {/* Bearing Clearances */}
        <section className="detail-section">
          <h2>Bearing Clearances</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Cam Bearing Clearance</span>
              <span className="spec-value">{build.cam_bearing_clearance_in ? `${build.cam_bearing_clearance_in} in` : '—'}</span>
            </div>
          </div>

          {/* Engine Notes */}
          <ComponentNotes
            buildId={build.id}
            component="engine-internals"
            componentTitle="Engine"
            isOwner={build.is_owner}
          />
        </section>

        {/* Vehicle Information */}
        <section className="detail-section">
          <h2>Vehicle Information</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Year</span>
              <span className="spec-value">{build.vehicle_year || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Make</span>
              <span className="spec-value">{build.vehicle_make || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Model</span>
              <span className="spec-value">{build.vehicle_model || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Trim</span>
              <span className="spec-value">{build.vehicle_trim || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">VIN</span>
              <span className="spec-value">{build.vin || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Weight</span>
              <span className="spec-value">{build.vehicle_weight_lbs ? `${build.vehicle_weight_lbs} lbs` : '—'}</span>
            </div>
          </div>
        </section>

        {/* Transmission */}
        <section className="detail-section">
          <h2>Transmission</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Type</span>
              <span className="spec-value">{build.transmission_type || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Model</span>
              <span className="spec-value">{build.transmission_model || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Number of Gears</span>
              <span className="spec-value">{build.transmission_gears || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Final Drive Ratio</span>
              <span className="spec-value">{build.final_drive_ratio || '—'}</span>
            </div>
          </div>

          {/* Transmission Notes */}
          <ComponentNotes
            buildId={build.id}
            component="transmission"
            componentTitle="Transmission"
            isOwner={build.is_owner}
          />
        </section>

        {/* Suspension & Handling */}
        <section className="detail-section">
          <h2>Suspension & Handling</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Front Suspension</span>
              <span className="spec-value">{build.suspension_front || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rear Suspension</span>
              <span className="spec-value">{build.suspension_rear || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Front Spring Rate</span>
              <span className="spec-value">{build.spring_rate_front || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rear Spring Rate</span>
              <span className="spec-value">{build.spring_rate_rear || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Front Sway Bar</span>
              <span className="spec-value">{build.sway_bar_front || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rear Sway Bar</span>
              <span className="spec-value">{build.sway_bar_rear || '—'}</span>
            </div>
          </div>

          {/* Suspension Notes */}
          <ComponentNotes
            buildId={build.id}
            component="suspension"
            componentTitle="Suspension"
            isOwner={build.is_owner}
          />
        </section>

        {/* Tires & Wheels */}
        <section className="detail-section">
          <h2>Tires & Wheels</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Front Tire Size</span>
              <span className="spec-value">{build.tire_size_front || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rear Tire Size</span>
              <span className="spec-value">{build.tire_size_rear || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Tire Brand</span>
              <span className="spec-value">{build.tire_brand || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Tire Model</span>
              <span className="spec-value">{build.tire_model || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Front Wheel Size</span>
              <span className="spec-value">{build.wheel_size_front || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Rear Wheel Size</span>
              <span className="spec-value">{build.wheel_size_rear || '—'}</span>
            </div>
          </div>

          {/* Tires & Wheels Notes */}
          <ComponentNotes
            buildId={build.id}
            component="tires-wheels"
            componentTitle="Tires & Wheels"
            isOwner={build.is_owner}
          />
        </section>

        {/* Fluids & Lubricants */}
        <section className="detail-section">
          <h2>Fluids & Lubricants</h2>
          <div className="spec-grid">
            <div className="spec-item">
              <span className="spec-label">Engine Oil Type</span>
              <span className="spec-value">{build.engine_oil_type || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Engine Oil Weight</span>
              <span className="spec-value">{build.engine_oil_weight || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Engine Oil Capacity</span>
              <span className="spec-value">{build.engine_oil_capacity || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Transmission Fluid Type</span>
              <span className="spec-value">{build.transmission_fluid_type || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Differential Fluid Type</span>
              <span className="spec-value">{build.differential_fluid_type || '—'}</span>
            </div>
            <div className="spec-item">
              <span className="spec-label">Coolant Type</span>
              <span className="spec-value">{build.coolant_type || '—'}</span>
            </div>
          </div>
        </section>

        {/* Engine Parts */}
        {build.engine_parts && build.engine_parts.length > 0 && (
          <section className="detail-section">
            <h2>Engine Parts</h2>
            <div className="parts-list">
              {build.engine_parts.map((part, index) => (
                <div key={index} className="part-item">
                  <div className="part-header">
                    <strong>{part.role || part.category}</strong>
                    {part.brand && <span className="part-brand">{part.brand}</span>}
                    {part.cost && <span className="part-cost">${parseFloat(part.cost).toFixed(2)}</span>}
                  </div>
                  <div className="part-details">
                    {part.name && <div>{part.name}</div>}
                    {part.part_number && <div className="part-number">P/N: {part.part_number}</div>}
                    {part.bp_notes && <div className="part-notes">{part.bp_notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vehicle Parts */}
        {build.vehicle_parts && build.vehicle_parts.length > 0 && (
          <section className="detail-section">
            <h2>Vehicle Parts</h2>
            <div className="parts-list">
              {build.vehicle_parts.map((part, index) => (
                <div key={index} className="part-item">
                  <div className="part-header">
                    <strong>{part.role || part.location}</strong>
                    {part.brand && <span className="part-brand">{part.brand}</span>}
                    {part.cost && <span className="part-cost">${parseFloat(part.cost).toFixed(2)}</span>}
                  </div>
                  <div className="part-details">
                    {part.name && <div>{part.name}</div>}
                    {part.part_number && <div className="part-number">P/N: {part.part_number}</div>}
                    {part.notes && <div className="part-notes">{part.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Performance Tests */}
        {build.performance && build.performance.length > 0 && (
          <section className="detail-section">
            <h2>Performance Tests</h2>
            {build.performance.map((test: any, index: number) => (
              <div key={index} className="performance-test">
                <div className="test-header">
                  <strong>{test.test_location || 'Test'}</strong>
                  <span className="test-date">{new Date(test.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="spec-grid">
                  {test.zero_to_60_sec && (
                    <div className="spec-item">
                      <span className="spec-label">0-60</span>
                      <span className="spec-value">{test.zero_to_60_sec} sec</span>
                    </div>
                  )}
                  {test.quarter_mile_et && (
                    <div className="spec-item">
                      <span className="spec-label">1/4 Mile ET</span>
                      <span className="spec-value">{test.quarter_mile_et} sec</span>
                    </div>
                  )}
                  {test.quarter_mile_mph && (
                    <div className="spec-item">
                      <span className="spec-label">1/4 Mile MPH</span>
                      <span className="spec-value">{test.quarter_mile_mph} mph</span>
                    </div>
                  )}
                  {test.dyno_hp && (
                    <div className="spec-item">
                      <span className="spec-label">Dyno HP</span>
                      <span className="spec-value">{test.dyno_hp} hp</span>
                    </div>
                  )}
                </div>
                {test.notes && <div className="test-notes">{test.notes}</div>}
              </div>
            ))}
          </section>
        )}

        {/* Maintenance History */}
        <section className="detail-section">
          <div className="section-header">
            <h2>Maintenance History</h2>
            {build.is_owner && (
              <button
                className="btn btn-primary"
                onClick={() => setShowMaintenanceModal(true)}
              >
                Add Maintenance Record
              </button>
            )}
          </div>

          {build.maintenance && build.maintenance.length > 0 ? (
            <div className="maintenance-list">
              {build.maintenance.map((record: any, index: number) => (
                <div
                  key={record.id || index}
                  className="maintenance-record"
                  onClick={build.is_owner ? () => handleEditMaintenance(record) : undefined}
                  style={{ cursor: build.is_owner ? 'pointer' : 'default' }}
                >
                  <div className="maintenance-header">
                    <strong>{record.maintenance_type}</strong>
                    <span className="maintenance-date">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="maintenance-details">
                    {record.odometer_miles && (
                      <div className="detail-item">
                        <strong>Odometer:</strong> {record.odometer_miles.toLocaleString()} mi
                      </div>
                    )}
                    {record.engine_hours && (
                      <div className="detail-item">
                        <strong>Engine Hours:</strong> {record.engine_hours}
                      </div>
                    )}
                  </div>

                  {(record.brand || record.part_number || record.quantity) && (
                    <div className="maintenance-parts">
                      <strong>Parts:</strong>
                      <div className="parts-details">
                        {record.brand && <span>Brand: {record.brand}</span>}
                        {record.part_number && <span>P/N: {record.part_number}</span>}
                        {record.quantity && <span>Qty: {record.quantity}</span>}
                      </div>
                    </div>
                  )}

                  {record.notes && (
                    <div className="maintenance-notes">
                      <strong>Notes:</strong>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  {build.is_owner && (
                    <div className="maintenance-footer">
                      <small>Click to edit</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No maintenance records yet.{build.is_owner && ' Click "Add Maintenance Record" to track your first service.'}</p>
            </div>
          )}
        </section>

        {/* Notes */}
        {build.notes && (
          <section className="detail-section">
            <h2>Notes</h2>
            <p className="build-notes">{build.notes}</p>
          </section>
        )}
      </div>

      {/* Maintenance Record Modal */}
      {showMaintenanceModal && (
        <MaintenanceRecordModal
          buildId={parseInt(id!)}
          editingRecord={editingMaintenance}
          onClose={() => {
            setShowMaintenanceModal(false);
            setEditingMaintenance(null);
          }}
          onSuccess={() => {
            // Reload build data to show new/updated maintenance record
            loadBuild(parseInt(id!));
            setEditingMaintenance(null);
          }}
        />
      )}
    </div>
  );
};
