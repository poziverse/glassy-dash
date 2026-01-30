import React, { useState, useEffect, useCallback } from 'react'
import {
  Bug,
  CheckCircle,
  XCircle,
  Trash2,
  RefreshCw,
  Clock,
  ExternalLink,
  Monitor,
  AlertCircle,
  MessageSquare,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useUIStore } from '../../stores/uiStore'

export default function BugReportViewer({ token }) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const showToast = useUIStore(state => state.showToast)
  const showGenericConfirm = useUIStore(state => state.showGenericConfirm)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api('/bug-reports', { token })
      setReports(Array.isArray(data) ? data : [])
    } catch (err) {
      showToast('Failed to load bug reports', 'error')
    } finally {
      setLoading(false)
    }
  }, [token, showToast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const updateStatus = async (id, status) => {
    try {
      await api(`/bug-reports/${id}`, {
        method: 'PATCH',
        token,
        body: { status },
      })
      setReports(prev => prev.map(r => (r.id === id ? { ...r, status } : r)))
      showToast(`Report marked as ${status}`, 'success')
    } catch (err) {
      showToast('Failed to update status', 'error')
    }
  }

  const deleteReport = async id => {
    try {
      await api(`/bug-reports/${id}`, {
        method: 'DELETE',
        token,
      })
      setReports(prev => prev.filter(r => r.id !== id))
      showToast('Report deleted', 'success')
    } catch (err) {
      showToast('Failed to delete report', 'error')
    }
  }

  const confirmDelete = report => {
    showGenericConfirm({
      title: 'Delete Report',
      message: 'Are you sure you want to delete this bug report?',
      confirmText: 'Delete',
      danger: true,
      onConfirm: () => deleteReport(report.id),
    })
  }

  // Helper to format metadata safely
  const formatMetadata = jsonStr => {
    try {
      const data = JSON.parse(jsonStr)
      return (
        <div className="text-xs text-gray-400 space-y-1">
          {data.url && (
            <div
              className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs"
              title={data.url}
            >
              <ExternalLink size={10} />
              {data.url}
            </div>
          )}
          {data.screen && (
            <div className="flex items-center gap-1">
              <Monitor size={10} />
              {data.screen}
            </div>
          )}
          {data.userAgent && (
            <div className="truncate opacity-75" title={data.userAgent}>
              {data.userAgent}
            </div>
          )}
        </div>
      )
    } catch {
      return <span className="text-xs text-gray-500">Invalid Metadata</span>
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Bug size={20} className="text-red-400" />
          Bug Reports
        </h2>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-white/10 bg-white/5">
              <th className="py-3 px-5 font-medium text-gray-400 w-24">Status</th>
              <th className="py-3 px-5 font-medium text-gray-400">Description</th>
              <th className="py-3 px-5 font-medium text-gray-400 w-48">Reporter</th>
              <th className="py-3 px-5 font-medium text-gray-400 w-64">Context</th>
              <th className="py-3 px-5 font-medium text-gray-400 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500">
                  <CheckCircle size={32} className="mx-auto mb-2 opacity-50 text-green-500" />
                  No open bug reports!
                </td>
              </tr>
            )}
            {reports.map(report => (
              <tr
                key={report.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-4 px-5 align-top">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      report.status === 'open'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : report.status === 'resolved'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}
                  >
                    {report.status === 'open' && <AlertCircle size={12} />}
                    {report.status === 'resolved' && <CheckCircle size={12} />}
                    {report.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-5 align-top">
                  <p className="whitespace-pre-wrap text-gray-200 mb-1">{report.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock size={12} />
                    {new Date(report.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="py-4 px-5 align-top text-gray-400">
                  {report.email ? (
                    <div className="flex items-center gap-2">
                      <MessageSquare size={14} className="text-gray-500" />
                      {report.email}
                    </div>
                  ) : (
                    <span className="italic opacity-50">Anonymous</span>
                  )}
                  {report.user_id && (
                    <div className="text-xs opacity-50 mt-1">ID: {report.user_id}</div>
                  )}
                </td>
                <td className="py-4 px-5 align-top">{formatMetadata(report.metadata)}</td>
                <td className="py-4 px-5 align-top text-right space-x-2">
                  {report.status === 'open' ? (
                    <button
                      onClick={() => updateStatus(report.id, 'resolved')}
                      className="p-1.5 rounded-lg hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-colors"
                      title="Mark Resolved"
                    >
                      <CheckCircle size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(report.id, 'open')}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Reopen"
                    >
                      <AlertCircle size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => confirmDelete(report)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
