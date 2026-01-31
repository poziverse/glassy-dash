import React, { useState, useEffect } from 'react'
import { useVoiceStore } from '../../stores/voiceStore'
import { checkDatabaseHealth, repairDatabase, resetVoiceStorage } from '../../utils/audioStorage'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Database,
} from 'lucide-react'

export default function StorageHealthCheck() {
  const { recordingState, resetRecordingState, clearCorruptedRecordings } = useVoiceStore()
  const [isChecking, setIsChecking] = useState(true)
  const [issues, setIssues] = useState([])
  const [isRepairing, setIsRepairing] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [dbHealth, setDbHealth] = useState(null)

  useEffect(() => {
    performHealthCheck()
  }, [])

  const performHealthCheck = async () => {
    setIsChecking(true)
    const foundIssues = []

    // Check recording state
    if (recordingState === 'processing' || recordingState === 'recording') {
      foundIssues.push({
        type: 'stuck-recording',
        severity: 'high',
        message: 'Recording stuck in processing state',
        fix: 'Reset recording state',
      })
    }

    // Check database health
    const dbHealthResult = await checkDatabaseHealth()
    setDbHealth(dbHealthResult)

    if (!dbHealthResult.healthy) {
      foundIssues.push({
        type: 'database-error',
        severity: 'high',
        message: 'Database access failed',
        error: dbHealthResult.error?.message,
        fix: 'Repair database',
      })
    }

    setIssues(foundIssues)
    setIsChecking(false)
  }

  const handleResetRecording = () => {
    resetRecordingState()
    setIssues(prev => prev.filter(i => i.type !== 'stuck-recording'))
  }

  const handleRepairDatabase = async () => {
    setIsRepairing(true)
    const result = await repairDatabase()
    setIsRepairing(false)

    if (result.success) {
      await performHealthCheck()
    }
  }

  const handleResetStorage = async () => {
    if (!confirm('Are you sure? This will delete all recordings!')) {
      return
    }

    setIsResetting(true)
    const result = await resetVoiceStorage()
    setIsResetting(false)

    if (result.success) {
      window.location.reload()
    }
  }

  if (isChecking) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-4 border border-white/10">
          <RefreshCw size={48} className="text-indigo-400 animate-spin" />
          <div className="text-white font-medium">Checking storage health...</div>
        </div>
      </div>
    )
  }

  if (issues.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full mx-4 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={32} className="text-yellow-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Storage Issues Detected</h2>
            <p className="text-sm text-gray-400">
              {issues.length} issue{issues.length > 1 ? 's' : ''} found
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                issue.severity === 'high'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}
            >
              <div className="flex items-start gap-2">
                {issue.severity === 'high' ? (
                  <XCircle size={18} className="text-red-400 mt-0.5" />
                ) : (
                  <AlertTriangle size={18} className="text-yellow-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{issue.message}</p>
                  {issue.error && (
                    <p className="text-sm text-gray-400 mt-1">{issue.error}</p>
                  )}
                  {issue.fix && (
                    <p className="text-sm text-indigo-400 mt-1">Suggested: {issue.fix}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Database Info */}
        {dbHealth && dbHealth.healthy && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 mb-4 flex items-center gap-2">
            <Database size={16} className="text-green-400" />
            <span className="text-sm text-green-400">
              Database healthy ({dbHealth.count} audio files stored)
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {issues.some(i => i.type === 'stuck-recording') && (
            <button
              onClick={handleResetRecording}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
            >
              <RefreshCw size={18} />
              Reset Recording State
            </button>
          )}

          {issues.some(i => i.type === 'database-error') && (
            <button
              onClick={handleRepairDatabase}
              disabled={isRepairing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 disabled:bg-yellow-700 text-white font-medium transition-colors"
            >
              {isRepairing ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Repair Database
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-400 my-2">
            <div className="flex-1 h-px bg-white/10"></div>
            <span>or</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <button
            onClick={handleResetStorage}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-500 disabled:bg-red-700 text-white font-medium transition-colors"
          >
            {isResetting ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Reset All Storage (Delete All)
              </>
            )}
          </button>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full mt-4 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}