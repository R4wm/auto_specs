import React, { useState, useEffect } from 'react';
import { snapshotsAPI, Snapshot, SnapshotDiff } from '../services/api';

interface VersionHistoryTimelineProps {
  buildId: number;
  onRestore?: () => void;
}

export const VersionHistoryTimeline: React.FC<VersionHistoryTimelineProps> = ({
  buildId,
  onRestore
}) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<number | null>(null);
  const [compareSnapshot, setCompareSnapshot] = useState<number | null>(null);
  const [diff, setDiff] = useState<SnapshotDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadSnapshots();
  }, [buildId]);

  const loadSnapshots = async () => {
    try {
      const data = await snapshotsAPI.getHistory(buildId);
      setSnapshots(data);
    } catch (err: any) {
      console.error('Failed to load snapshots:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiff = async (snapshot1Id: number, snapshot2Id: number) => {
    try {
      const diffData = await snapshotsAPI.compareDiff(snapshot1Id, snapshot2Id);
      setDiff(diffData);
      setSelectedSnapshot(snapshot1Id);
      setCompareSnapshot(snapshot2Id);
    } catch (err: any) {
      console.error('Failed to load diff:', err);
      setError('Failed to load changes');
    }
  };

  const handleRestore = async (snapshotId: number) => {
    if (!confirm('Are you sure you want to restore this version? This will replace your current build data.')) {
      return;
    }

    setIsRestoring(true);
    setError('');

    try {
      await snapshotsAPI.restore(buildId, snapshotId);
      alert('Build restored successfully!');
      if (onRestore) {
        onRestore();
      }
      loadSnapshots();
    } catch (err: any) {
      console.error('Failed to restore snapshot:', err);
      setError('Failed to restore version');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSnapshotIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return '✏️';
      case 'maintenance':
        return '🔧';
      case 'before_maintenance':
        return '📸';
      case 'performance_test':
        return '🏁';
      default:
        return '📝';
    }
  };

  const getSnapshotLabel = (snapshot: Snapshot) => {
    if (snapshot.snapshot_type === 'maintenance' && snapshot.maintenance_type) {
      return snapshot.maintenance_type;
    }
    return snapshot.change_description || snapshot.snapshot_type.replace(/_/g, ' ');
  };

  if (loading) {
    return <div className="timeline-loading">Loading version history...</div>;
  }

  if (error) {
    return <div className="timeline-error">{error}</div>;
  }

  if (snapshots.length === 0) {
    return (
      <div className="timeline-empty">
        <p>No version history available yet.</p>
        <p className="empty-subtitle">Changes will appear here as you modify your build.</p>
      </div>
    );
  }

  return (
    <div className="version-history-timeline">
      <div className="timeline-header">
        <h3>Version History</h3>
        <p className="timeline-subtitle">
          Track all changes made to your build over time
        </p>
      </div>

      <div className="timeline-content">
        <div className="timeline-list">
          {snapshots.map((snapshot, index) => (
            <div key={snapshot.id} className="timeline-item">
              <div className="timeline-marker">
                <div className="timeline-icon">{getSnapshotIcon(snapshot.snapshot_type)}</div>
                {index < snapshots.length - 1 && <div className="timeline-line"></div>}
              </div>

              <div className="timeline-card">
                <div className="card-header">
                  <div className="card-title">
                    <strong>{getSnapshotLabel(snapshot)}</strong>
                    <span className="snapshot-type">{snapshot.snapshot_type}</span>
                  </div>
                  <div className="card-meta">
                    <span className="snapshot-date">{formatDate(snapshot.created_at)}</span>
                    {snapshot.first_name && snapshot.last_name && (
                      <span className="snapshot-user">
                        by {snapshot.first_name} {snapshot.last_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-actions">
                  {index < snapshots.length - 1 && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleViewDiff(snapshot.id, snapshots[index + 1].id)}
                    >
                      View Changes
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleRestore(snapshot.id)}
                    disabled={isRestoring}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {diff && (
          <div className="diff-modal-overlay" onClick={() => setDiff(null)}>
            <div className="diff-modal" onClick={(e) => e.stopPropagation()}>
              <div className="diff-header">
                <h3>Changes</h3>
                <button className="close-btn" onClick={() => setDiff(null)}>×</button>
              </div>

              <div className="diff-content">
                <div className="diff-snapshots">
                  <div className="diff-snapshot">
                    <strong>Before:</strong> {formatDate(diff.snapshot_before.created_at)}
                  </div>
                  <div className="diff-arrow">→</div>
                  <div className="diff-snapshot">
                    <strong>After:</strong> {formatDate(diff.snapshot_after.created_at)}
                  </div>
                </div>

                <div className="diff-changes">
                  {Object.entries(diff.changes).map(([key, change]) => {
                    if (!change.has_changes) return null;

                    return (
                      <div key={key} className="change-item">
                        <div className="change-field">{key.replace(/_/g, ' ')}</div>
                        <div className="change-values">
                          <div className="change-before">
                            <span className="label">Before:</span>
                            <code>{JSON.stringify(change.before, null, 2)}</code>
                          </div>
                          <div className="change-after">
                            <span className="label">After:</span>
                            <code>{JSON.stringify(change.after, null, 2)}</code>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .version-history-timeline {
          background: white;
          border-radius: 8px;
          padding: 24px;
        }

        .timeline-header {
          margin-bottom: 24px;
        }

        .timeline-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .timeline-subtitle {
          color: #718096;
          font-size: 0.875rem;
        }

        .timeline-loading,
        .timeline-error,
        .timeline-empty {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .timeline-error {
          color: #e53e3e;
        }

        .empty-subtitle {
          font-size: 0.875rem;
          margin-top: 8px;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .timeline-item {
          display: flex;
          gap: 16px;
        }

        .timeline-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 4px;
        }

        .timeline-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
          z-index: 1;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: #e2e8f0;
          margin-top: 8px;
        }

        .timeline-card {
          flex: 1;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .card-header {
          margin-bottom: 12px;
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .card-title strong {
          font-size: 1.125rem;
          color: #2d3748;
        }

        .snapshot-type {
          font-size: 0.75rem;
          padding: 2px 8px;
          background: #e2e8f0;
          border-radius: 12px;
          color: #4a5568;
          text-transform: uppercase;
          font-weight: 600;
        }

        .card-meta {
          display: flex;
          gap: 12px;
          font-size: 0.875rem;
          color: #718096;
        }

        .card-actions {
          display: flex;
          gap: 8px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8125rem;
        }

        .btn-secondary {
          background: #4c51bf;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #434190;
        }

        .btn-outline {
          background: transparent;
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

        .diff-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .diff-modal {
          background: white;
          border-radius: 12px;
          max-width: 900px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .diff-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .diff-header h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #718096;
          line-height: 1;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .close-btn:hover {
          color: #2d3748;
        }

        .diff-content {
          padding: 20px;
        }

        .diff-snapshots {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 16px;
          background: #f7fafc;
          border-radius: 8px;
        }

        .diff-snapshot {
          flex: 1;
          font-size: 0.875rem;
          color: #4a5568;
        }

        .diff-arrow {
          font-size: 1.5rem;
          color: #a0aec0;
        }

        .diff-changes {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .change-item {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }

        .change-field {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
          text-transform: capitalize;
        }

        .change-values {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .change-before,
        .change-after {
          padding: 12px;
          border-radius: 6px;
        }

        .change-before {
          background: #fed7d7;
        }

        .change-after {
          background: #c6f6d5;
        }

        .change-values .label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          color: #4a5568;
        }

        .change-values code {
          display: block;
          font-size: 0.875rem;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @media (max-width: 768px) {
          .change-values {
            grid-template-columns: 1fr;
          }

          .diff-snapshots {
            flex-direction: column;
            align-items: stretch;
          }

          .diff-arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
};
