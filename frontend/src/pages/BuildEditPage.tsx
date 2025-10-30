import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { buildsAPI, BuildDetail } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BasicInfoEditor } from '../components/BasicInfoEditor';
import { EngineSpecsEditor } from '../components/EngineSpecsEditor';
import { SuspensionEditor } from '../components/SuspensionEditor';
import { FluidsEditor } from '../components/FluidsEditor';

export const BuildEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [formChanges, setFormChanges] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'engine-specs', label: 'Engine Specs' },
    { id: 'engine-internals', label: 'Engine Internals' },
    { id: 'differential', label: 'Differential' },
    { id: 'transmission', label: 'Transmission' },
    { id: 'suspension', label: 'Suspension' },
    { id: 'cab-body', label: 'Cab & Body' },
    { id: 'tires-wheels', label: 'Tires & Wheels' },
    { id: 'fluids', label: 'Fluids' }
  ];

  useEffect(() => {
    if (id) {
      loadBuild(parseInt(id));
    }
  }, [id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadBuild = async (buildId: number) => {
    try {
      const data = await buildsAPI.getById(buildId);
      setBuild(data);
    } catch (err: any) {
      setError('Failed to load build');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditorChange = (changes: any) => {
    setFormChanges(prev => ({ ...prev, ...changes }));
    setHasUnsavedChanges(true);
  };

  const handleSaveAndExit = async () => {
    if (await handleSave()) {
      navigate(`/builds/${id}`);
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave();
  };

  const handleSave = async (): Promise<boolean> => {
    setIsSaving(true);
    setError('');

    try {
      // TODO: Implement save logic based on active tab
      // For now, just a placeholder
      console.log('Saving build...');

      setHasUnsavedChanges(false);
      return true;
    } catch (err: any) {
      console.error('Failed to save build:', err);
      setError(err.response?.data?.detail || 'Failed to save changes');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate(`/builds/${id}`);
      }
    } else {
      navigate(`/builds/${id}`);
    }
  };

  const handleLogout = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to logout?')) {
        logout();
        navigate('/login');
      }
    } else {
      logout();
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading build...</div>
      </div>
    );
  }

  if (error && !build) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
        <Link to={`/builds/${id}`} className="btn">
          Back to Build
        </Link>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="container">
        <div className="alert alert-error">Build not found</div>
        <Link to="/builds" className="btn">
          Back to Builds
        </Link>
      </div>
    );
  }

  return (
    <div className="build-edit-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <Link to={`/builds/${id}`} className="back-link">
            ← Back to Build
          </Link>
          <h1>Edit: {build.name}</h1>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </header>

      {/* Error Display */}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Tab Navigation */}
      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'basic' && (
          <BasicInfoEditor
            buildData={build}
            onChange={handleEditorChange}
          />
        )}

        {activeTab === 'engine-specs' && (
          <EngineSpecsEditor
            buildData={build}
            onChange={handleEditorChange}
          />
        )}

        {activeTab === 'engine-internals' && (
          <div className="editor-placeholder">
            <h2>Engine Internals Editor</h2>
            <p>Coming soon: EngineInternalsEditor integration</p>
          </div>
        )}

        {activeTab === 'differential' && (
          <div className="editor-placeholder">
            <h2>Rear Differential Editor</h2>
            <p>Coming soon: RearDifferentialEditor integration</p>
          </div>
        )}

        {activeTab === 'transmission' && (
          <div className="editor-placeholder">
            <h2>Transmission Editor</h2>
            <p>Coming soon: TransmissionEditor integration</p>
          </div>
        )}

        {activeTab === 'suspension' && (
          <SuspensionEditor
            buildData={build}
            onChange={handleEditorChange}
          />
        )}

        {activeTab === 'cab-body' && (
          <div className="editor-placeholder">
            <h2>Cab & Body Editor</h2>
            <p>Coming soon: CabBodyEditor component</p>
          </div>
        )}

        {activeTab === 'tires-wheels' && (
          <div className="editor-placeholder">
            <h2>Tires & Wheels Editor</h2>
            <p>Coming soon: TiresWheelsEditor component</p>
          </div>
        )}

        {activeTab === 'fluids' && (
          <FluidsEditor
            buildData={build}
            onChange={handleEditorChange}
          />
        )}
      </div>

      {/* Sticky Save Footer */}
      <div className="save-footer">
        <div className="save-footer-content">
          <button
            className="btn btn-secondary"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>

          <div className="save-buttons">
            <button
              className="btn btn-outline"
              onClick={handleSaveAndContinue}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save & Continue'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveAndExit}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? 'Saving...' : 'Save & Exit'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .build-edit-page {
          min-height: 100vh;
          background: #f9fafb;
          padding-bottom: 100px;
        }

        .page-header {
          background: white;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-header h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 8px 0 0 0;
        }

        .back-link {
          color: #4c51bf;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .back-link:hover {
          color: #434190;
        }

        .tabs {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          overflow-x: auto;
          padding: 0 24px;
        }

        .tab {
          padding: 16px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #4c51bf;
          background: #f9fafb;
        }

        .tab.active {
          color: #4c51bf;
          border-bottom-color: #4c51bf;
        }

        .tab-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .editor-placeholder {
          background: white;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          border: 2px dashed #e5e7eb;
        }

        .editor-placeholder h2 {
          color: #4b5563;
          margin-bottom: 8px;
        }

        .editor-placeholder p {
          color: #9ca3af;
        }

        .save-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.05);
          z-index: 100;
        }

        .save-footer-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .save-buttons {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
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
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }

        .btn-outline {
          background: white;
          color: #4c51bf;
          border: 1px solid #4c51bf;
        }

        .btn-outline:hover:not(:disabled) {
          background: #4c51bf;
          color: white;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .alert {
          max-width: 1200px;
          margin: 16px auto;
          padding: 12px 20px;
          border-radius: 6px;
        }

        .alert-error {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .tabs {
            padding: 0 12px;
          }

          .tab {
            padding: 12px 16px;
            font-size: 0.875rem;
          }

          .tab-content {
            padding: 16px;
          }

          .save-footer-content {
            flex-direction: column;
            gap: 12px;
          }

          .save-buttons {
            width: 100%;
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
