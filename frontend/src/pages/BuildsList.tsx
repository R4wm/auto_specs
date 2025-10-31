import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildsAPI } from '../services/api';
import type { Build } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const BuildsList: React.FC = () => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBuilds();
  }, []);

  const loadBuilds = async () => {
    try {
      const data = await buildsAPI.getAll();
      setBuilds(data);
    } catch (err: any) {
      setError('Failed to load builds');
      console.error('Error loading builds:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1>Auto Specs Manager</h1>
          <p>Welcome, {user?.first_name} {user?.last_name}!</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="builds-header">
        <h2>Engine Builds</h2>
        <Link to="/builds/new" className="btn btn-primary">
          + New Build
        </Link>
      </div>

      {builds.length === 0 ? (
        <div className="empty-state">
          <p>No builds yet. Create your first one!</p>
          <Link to="/builds/new" className="btn btn-primary">
            Create Build
          </Link>
        </div>
      ) : (
        <div className="builds-grid">
          {builds.map((build) => (
            <Link to={`/builds/${build.slug}`} key={build.id} className="build-card">
              <h3>{build.name}</h3>
              <div className="build-info">
                {build.displacement_ci && (
                  <div className="info-item">
                    <span className="label">Displacement:</span>
                    <span className="value">{build.displacement_ci} ci</span>
                  </div>
                )}
                {build.target_hp && (
                  <div className="info-item">
                    <span className="label">Target HP:</span>
                    <span className="value">{build.target_hp} hp</span>
                  </div>
                )}
                {build.use_type && (
                  <div className="info-item">
                    <span className="label">Use:</span>
                    <span className="value">{build.use_type}</span>
                  </div>
                )}
                {build.fuel_type && (
                  <div className="info-item">
                    <span className="label">Fuel:</span>
                    <span className="value">{build.fuel_type}</span>
                  </div>
                )}
              </div>
              <div className="build-owner">
                Built by: {build.first_name} {build.last_name}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
