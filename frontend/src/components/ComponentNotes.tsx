import React, { useState, useEffect } from 'react';
import { componentNotesAPI, ComponentNote, ComponentType } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ComponentNotesProps {
  buildId: number;
  component: ComponentType;
  componentTitle: string;
  isOwner: boolean;
}

export const ComponentNotes: React.FC<ComponentNotesProps> = ({
  buildId,
  component,
  componentTitle,
  isOwner,
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<ComponentNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedNotes = await componentNotesAPI.getAll(buildId, component);
      // Sort by timestamp descending (newest first)
      setNotes(fetchedNotes.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [buildId, component]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const newNote = await componentNotesAPI.add(buildId, component, newNoteContent.trim());
      setNotes([newNote, ...notes]); // Add to top of list
      setNewNoteContent('');
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add note');
      console.error('Error adding note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const updatedNote = await componentNotesAPI.update(
        buildId,
        component,
        noteId,
        editContent.trim()
      );
      setNotes(notes.map(note => note.id === noteId ? updatedNote : note));
      setEditingNoteId(null);
      setEditContent('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update note');
      console.error('Error updating note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      setSubmitting(true);
      setError(null);
      await componentNotesAPI.delete(buildId, component, noteId);
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete note');
      console.error('Error deleting note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (note: ComponentNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return <div className="component-notes-loading">Loading notes...</div>;
  }

  return (
    <div className="component-notes-section">
      <div className="component-notes-header">
        <h3>{componentTitle} Notes</h3>
        {isOwner && !showAddForm && (
          <button
            className="btn-add-note"
            onClick={() => setShowAddForm(true)}
            disabled={submitting}
          >
            + Add Note
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {showAddForm && isOwner && (
        <form onSubmit={handleAddNote} className="note-form">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Enter your note..."
            rows={3}
            autoFocus
            disabled={submitting}
          />
          <div className="note-form-actions">
            <button type="submit" className="btn-primary" disabled={submitting || !newNoteContent.trim()}>
              {submitting ? 'Adding...' : 'Add Note'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowAddForm(false);
                setNewNoteContent('');
              }}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="no-notes">
            No notes yet. {isOwner && 'Click "Add Note" to create one.'}
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="note-item">
              <div className="note-header">
                <div className="note-meta">
                  <span className="note-author">{note.user_name}</span>
                  <span className="note-date">{formatDate(note.timestamp)}</span>
                  {note.last_edited && (
                    <span className="note-edited">(edited {formatDate(note.last_edited)})</span>
                  )}
                </div>
                {isOwner && user && note.user_id === user.id && (
                  <div className="note-actions">
                    {editingNoteId === note.id ? (
                      <>
                        <button
                          className="btn-icon btn-save"
                          onClick={() => handleEditNote(note.id)}
                          disabled={submitting || !editContent.trim()}
                          title="Save"
                        >
                          ✓
                        </button>
                        <button
                          className="btn-icon btn-cancel"
                          onClick={cancelEditing}
                          disabled={submitting}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => startEditing(note)}
                          disabled={submitting}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={submitting}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="note-content">
                {editingNoteId === note.id ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="note-edit-textarea"
                    disabled={submitting}
                  />
                ) : (
                  <p>{note.content}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
