import React from 'react'
import { useNotes } from '../contexts/NotesContext'
import { useAuth, useUI } from '../contexts'
import DashboardLayout from './DashboardLayout'
import { Trash2, RotateCcw, Trash, AlertTriangle, Clock } from 'lucide-react'

export function TrashView() {
  const {
    trashNotes = [],
    trashLoading,
    restoreNote,
    emptyTrash,
    permanentDeleteNote,
  } = useNotes()
  const { currentUser, signOut } = useAuth()
  const { showGenericConfirm, showToast, setSettingsPanelOpen } = useUI()

  const formatDate = timestamp => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilExpiration = timestamp => {
    if (!timestamp) return null
    const date = new Date(timestamp * 1000)
    const expirationDate = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000)
    const now = new Date()
    const diffDays = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleRestore = async noteId => {
    try {
      await restoreNote(noteId)
      if (showToast) showToast('Note restored successfully', 'success')
    } catch (error) {
      if (showToast) showToast('Failed to restore: ' + error.message, 'error')
    }
  }

  const handlePermanentDelete = async noteId => {
    if (showGenericConfirm) {
      showGenericConfirm({
        title: 'Delete Permanently',
        message: 'This action cannot be undone. Are you sure you want to permanently delete this note?',
        confirmText: 'Delete Forever',
        danger: true,
        onConfirm: async () => {
          try {
            await permanentDeleteNote(noteId)
            if (showToast) showToast('Note permanently deleted', 'success')
          } catch (error) {
            if (showToast) showToast('Failed to delete: ' + error.message, 'error')
          }
        }
      })
    } else if (window.confirm('Permanently delete this note?')) {
      try {
        await permanentDeleteNote(noteId)
      } catch (error) {
        alert('Failed to delete: ' + error.message)
      }
    }
  }

  const handleEmptyTrash = async () => {
    if (showGenericConfirm) {
      showGenericConfirm({
        title: 'Empty Trash',
        message: 'All notes in trash will be permanently deleted. This cannot be recovered.',
        confirmText: 'Empty Everything',
        danger: true,
        onConfirm: async () => {
          try {
            await emptyTrash()
            if (showToast) showToast('Trash emptied', 'success')
          } catch (error) {
            if (showToast) showToast('Failed to empty trash: ' + error.message, 'error')
          }
        }
      })
    } else if (window.confirm('Empty trash? All notes will be lost forever.')) {
      try {
        await emptyTrash()
      } catch (error) {
        alert('Failed to empty trash: ' + error.message)
      }
    }
  }

  return (
    <DashboardLayout
      activeSection="trash"
      onNavigate={section => {
        if (['health', 'alerts', 'admin', 'trash', 'docs', 'voice', 'settings'].includes(section)) {
          window.location.hash = `#/${section}`
        } else if (section === 'overview') {
          window.location.hash = '#/notes'
        }
      }}
      user={currentUser}
      title="Trash"
      headerActions={
        trashNotes.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-semibold group"
          >
            <Trash size={14} className="group-hover:scale-110 transition-transform" />
            Empty Trash
          </button>
        )
      }
      onSignOut={signOut}
      onOpenSettings={() => setSettingsPanelOpen(true)}
    >
      {/* Content Grid */}
      {trashLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-white/5"></div>
            <div className="absolute inset-0 rounded-full border-t-2 border-[var(--color-accent)] animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-500 font-medium">Loading your trash...</p>
        </div>
      ) : trashNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card rounded-3xl border border-white/5 bg-white/[0.02]">
          <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-gray-600">
            <Trash2 size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Trash is empty</h3>
          <p className="text-gray-500 text-center max-w-xs">
            When you delete notes, they'll show up here for 30 days.
          </p>
          <button 
            onClick={() => window.location.hash = '#/notes'}
            className="mt-8 px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all text-sm font-medium"
          >
            Back to Notes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trashNotes.map(note => {
            const daysLeft = getDaysUntilExpiration(note.deleted_at)
            const isExpiringSoon = daysLeft !== null && daysLeft <= 7

            return (
              <div 
                key={note.id} 
                className="group relative flex flex-col h-full glass-card rounded-2xl border border-white/[0.08] bg-[#16161c]/40 hover:bg-[#1a1a24]/60 transition-all hover:border-white/20 hover:shadow-2xl hover:shadow-black/40 overflow-hidden"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-3">
                     <span className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-[var(--color-accent)] transition-colors">
                          {note.type === 'checklist' ? '✅' : '📝'}
                     </span>
                     <span className="text-[10px] uppercase tracking-widest font-bold text-gray-600 bg-white/5 px-2 py-1 rounded">
                       {note.type || 'text'}
                     </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
                    {note.title || 'Untitled Note'}
                  </h3>
                  
                  <p className="text-gray-400 text-sm line-clamp-4 leading-relaxed">
                    {note.content || (note.items ? `${note.items.length} checklist items` : 'No content')}
                  </p>
                </div>

                <div className="p-5 pt-0 mt-auto">
                  <div className="flex flex-col gap-3 py-4 border-t border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-gray-500">
                         <Clock size={12} />
                         <span>Deleted {formatDate(note.deleted_at)}</span>
                      </div>
                      {daysLeft !== null && (
                        <span className={`font-semibold ${isExpiringSoon ? 'text-amber-400' : 'text-gray-400'}`}>
                          {daysLeft}d left
                        </span>
                      )}
                    </div>

                    {isExpiringSoon && (
                       <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-400/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                          <AlertTriangle size={10} />
                          Expiring Soon
                       </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(note.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/20 transition-all text-sm font-bold active:scale-95"
                    >
                      <RotateCcw size={16} />
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(note.id)}
                      className="w-11 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all active:scale-95 group/del"
                      title="Delete Permanently"
                    >
                      <Trash size={18} className="group-hover/del:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!trashLoading && trashNotes.length > 0 && (
         <div className="mt-12 flex items-center justify-center p-6 border-t border-white/5">
              <p className="text-gray-500 text-sm flex items-center gap-2 italic">
                 <AlertTriangle size={14} />
                 Notes are kept for 30 days before being permanently removed from our servers.
              </p>
         </div>
      )}
    </DashboardLayout>
  )
}