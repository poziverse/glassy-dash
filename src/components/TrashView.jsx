import React from 'react'
import { useNotes } from '../contexts/NotesContext'

/**
 * TrashView Component
 * Displays deleted notes with options to restore, permanently delete, or empty trash
 */
export function TrashView() {
  const {
    trashNotes,
    trashLoading,
    restoreNote,
    emptyTrash,
    permanentDeleteNote,
    viewTrash,
    setViewTrash,
  } = useNotes()

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp * 1000) // Convert from seconds to ms
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Deleted today'
    if (diffDays === 1) return 'Deleted yesterday'
    if (diffDays < 7) return `Deleted ${diffDays} days ago`
    if (diffDays < 30) return `Deleted ${Math.floor(diffDays / 7)} weeks ago`
    return `Deleted ${Math.floor(diffDays / 30)} months ago`
  }

  const getDaysUntilExpiration = (timestamp) => {
    if (!timestamp) return null
    const date = new Date(timestamp * 1000)
    const expirationDate = new Date(date.getTime() + (30 * 24 * 60 * 60 * 1000))
    const now = new Date()
    const diffDays = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleRestore = async (noteId) => {
    try {
      await restoreNote(noteId)
    } catch (error) {
      alert('Failed to restore note: ' + error.message)
    }
  }

  const handlePermanentDelete = async (noteId) => {
    if (!confirm('Are you sure you want to permanently delete this note? This action cannot be undone.')) {
      return
    }
    try {
      await permanentDeleteNote(noteId)
    } catch (error) {
      alert('Failed to delete note: ' + error.message)
    }
  }

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to empty the trash? All notes will be permanently deleted and cannot be recovered.')) {
      return
    }
    try {
      await emptyTrash()
    } catch (error) {
      alert('Failed to empty trash: ' + error.message)
    }
  }

  if (!viewTrash) {
    return null
  }

  return (
    <div className="trash-view">
      {/* Header */}
      <div className="trash-header">
        <h2>Trash</h2>
        <p className="trash-description">
          Notes in trash are automatically deleted after 30 days. You can restore them or delete them permanently.
        </p>
        <div className="trash-actions">
          <button 
            className="btn-empty-trash" 
            onClick={handleEmptyTrash}
            disabled={trashNotes.length === 0}
          >
            🗑️ Empty Trash
          </button>
          <button 
            className="btn-back-to-notes" 
            onClick={() => setViewTrash(false)}
          >
            ← Back to Notes
          </button>
        </div>
      </div>

      {/* Loading state */}
      {trashLoading && (
        <div className="trash-loading">
          <div className="spinner"></div>
          <p>Loading trash...</p>
        </div>
      )}

      {/* Empty state */}
      {!trashLoading && trashNotes.length === 0 && (
        <div className="trash-empty">
          <div className="empty-icon">🗑️</div>
          <h3>Trash is empty</h3>
          <p>Deleted notes will appear here and can be restored for up to 30 days.</p>
        </div>
      )}

      {/* Trash notes list */}
      {!trashLoading && trashNotes.length > 0 && (
        <div className="trash-notes-list">
          {trashNotes.map(note => {
            const daysUntilExpiration = getDaysUntilExpiration(note.deleted_at)
            const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7
            
            return (
              <div 
                key={note.id} 
                className={`trash-note ${isExpiringSoon ? 'expiring-soon' : ''}`}
              >
                <div className="trash-note-content">
                  <h3 className="trash-note-title">{note.title || 'Untitled'}</h3>
                  <p className="trash-note-preview">
                    {note.type === 'text' && note.content && (
                      <>{note.content.substring(0, 150)}{note.content.length > 150 && '...'}</>
                    )}
                    {note.type === 'checklist' && note.items && (
                      <>{note.items.length} item{note.items.length !== 1 ? 's' : ''}</>
                    )}
                  </p>
                  <div className="trash-note-meta">
                    <span className="trash-note-type">
                      {note.type === 'text' ? '📝' : '✅'}
                    </span>
                    <span className="trash-note-date">{formatDate(note.deleted_at)}</span>
                    {daysUntilExpiration !== null && (
                      <span className={`trash-note-expiration ${isExpiringSoon ? 'warning' : ''}`}>
                        {daysUntilExpiration <= 0 ? 'Expires soon' : `${daysUntilExpiration} days until expiration`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="trash-note-actions">
                  <button 
                    className="btn-restore"
                    onClick={() => handleRestore(note.id)}
                    title="Restore note"
                  >
                    ↩️ Restore
                  </button>
                  <button 
                    className="btn-permanent-delete"
                    onClick={() => handlePermanentDelete(note.id)}
                    title="Permanently delete"
                  >
                    🗑️ Delete Forever
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Trash info footer */}
      {!trashLoading && trashNotes.length > 0 && (
        <div className="trash-footer">
          <p>
            <strong>{trashNotes.length}</strong> note{trashNotes.length !== 1 ? 's' : ''} in trash
          </p>
          <p className="trash-warning">
            ⚠️ Notes older than 30 days are automatically deleted
          </p>
        </div>
      )}

      <style>{`
        .trash-view {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .trash-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .trash-header h2 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .trash-description {
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .trash-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-empty-trash,
        .btn-back-to-notes {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-empty-trash {
          background: var(--danger-color, #ef4444);
          color: white;
        }

        .btn-empty-trash:hover:not(:disabled) {
          background: var(--danger-dark, #dc2626);
          transform: translateY(-2px);
        }

        .btn-empty-trash:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-back-to-notes {
          background: var(--glass-bg, rgba(255, 255, 255, 0.1));
          color: var(--text-primary);
        }

        .btn-back-to-notes:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .trash-loading {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--glass-bg, rgba(255, 255, 255, 0.1));
          border-top: 4px solid var(--accent-color, #3b82f6);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .trash-empty {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .trash-empty h3 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .trash-empty p {
          color: var(--text-secondary);
          margin: 0;
        }

        .trash-notes-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .trash-note {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem;
          background: var(--glass-bg, rgba(255, 255, 255, 0.1));
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.2));
          transition: all 0.3s;
        }

        .trash-note:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        .trash-note.expiring-soon {
          border-color: var(--warning-color, #f59e0b);
        }

        .trash-note-content {
          flex: 1;
          min-width: 0;
        }

        .trash-note-title {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .trash-note-preview {
          margin: 0 0 1rem 0;
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .trash-note-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-top: 1rem;
          flex-wrap: wrap;
        }

        .trash-note-type {
          font-size: 1.25rem;
        }

        .trash-note-date {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .trash-note-expiration {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .trash-note-expiration.warning {
          color: var(--warning-color, #f59e0b);
          font-weight: 500;
        }

        .trash-note-actions {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .btn-restore,
        .btn-permanent-delete {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-restore {
          background: var(--accent-color, #3b82f6);
          color: white;
        }

        .btn-restore:hover {
          background: var(--accent-dark, #2563eb);
          transform: translateY(-2px);
        }

        .btn-permanent-delete {
          background: var(--danger-color, #ef4444);
          color: white;
        }

        .btn-permanent-delete:hover {
          background: var(--danger-dark, #dc2626);
          transform: translateY(-2px);
        }

        .trash-footer {
          margin-top: 2rem;
          padding: 1.5rem;
          background: var(--glass-bg, rgba(255, 255, 255, 0.1));
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          text-align: center;
        }

        .trash-footer p {
          margin: 0.5rem 0;
          color: var(--text-secondary);
        }

        .trash-warning {
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .trash-note {
            flex-direction: column;
          }

          .trash-note-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .trash-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}