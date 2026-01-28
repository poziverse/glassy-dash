/**
 * Provider Settings Component
 * Allows users to manage their AI provider configurations
 * Add/remove API keys for multiple AI services
 */

import React, { useState, useEffect } from 'react'
import { 
  CheckIcon, 
  ChevronDownIcon, 
  ChevronUpIcon, 
  XIcon, 
  TrashIcon, 
  PlusIcon,
  KeyIcon,
  RefreshCwIcon
} from 'lucide-react'
import { toast } from 'react-toastify'

// Provider type definitions
const PROVIDER_TYPES = {
  GEMINI: 'gemini',
  ZAI: 'zai',
  OLLAMA: 'ollama'
}

// Provider display information
const PROVIDER_INFO = {
  [PROVIDER_TYPES.GEMINI]: {
    name: 'Gemini',
    displayName: 'Google Gemini',
    description: 'High-quality AI assistant with multimodal capabilities',
    icon: '🧠',
    capabilities: ['Text', 'Audio', 'Images', 'Streaming', 'Structured Output', 'Tools', 'Multimodal', 'Embeddings'],
    color: '#4285F',
    docsUrl: 'https://cloud.google.com/vertex-ai/docs',
    defaultModel: 'gemini-2.5-flash',
    supportedModels: ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.0-flash-exp']
  },
  [PROVIDER_TYPES.ZAI]: {
    name: 'Z.ai',
    displayName: 'Z.ai',
    description: 'High-performance AI with exceptional image generation quality',
    icon: '🖼️',
    capabilities: ['Text', 'Images', 'Streaming'],
    color: '#7C3ED',
    docsUrl: 'https://z.ai/docs',
    defaultModel: '4.5-air',
    supportedModels: ['4.5-air', '4.6', '4.7']
  },
  [PROVIDER_TYPES.OLLAMA]: {
    name: 'Ollama',
    displayName: 'Ollama (Local)',
    description: 'Run local AI models on your own hardware',
    icon: '🏠',
    capabilities: ['Text', 'Images', 'Streaming'],
    color: '#6B7280',
    defaultModel: 'llama3',
    supportedModels: ['llama2', 'llama3', 'codellama', 'mistral']
  }
}

// Default provider configuration for new providers
const DEFAULT_CONFIG = {
  isActive: true,
  model: '',
  baseUrl: '',
  options: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40
  }
}

/**
 * Provider Settings Component
 */
function ProviderSettings({ user }) {
  const [userProviders, setUserProviders] = useState([]) // User's configured providers
  const [loading, setLoading] = useState(false) // Loading state
  const [editingProvider, setEditingProvider] = useState(null) // Provider being edited
  const [showAddDialog, setShowAddDialog] = useState(false) // Show add provider dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false) // Show delete confirmation dialog
  const [formData, setFormData] = useState(DEFAULT_CONFIG) // Form data for adding/editing

  // Fetch user's providers on mount
  useEffect(() => {
    fetchUserProviders()
  }, [user])

  /**
   * Fetch user's configured providers from server
   */
  async function fetchUserProviders() {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/providers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch providers')
      }

      const data = await response.json()
      setUserProviders(data.providers || [])
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      toast.error('Failed to load providers', {
        position: 'bottom-right',
        autoClose: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Add a new provider configuration
   */
  async function handleAddProvider(provider) {
    const config = {
      provider,
      apiKey: formData.apiKey,
      model: formData.model || PROVIDER_INFO[provider].defaultModel,
      baseUrl: formData.baseUrl,
      options: JSON.stringify(formData.options || {}),
      isActive: true
    }

    try {
      const response = await fetch('/api/ai/providers/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add provider')
      }

      await fetchUserProviders()
      setShowAddDialog(false)
      setFormData(DEFAULT_CONFIG)
      toast.success(`Added ${PROVIDER_INFO[provider].displayName} provider`, {
        position: 'bottom-right',
        autoClose: 3000
      })
    } catch (error) {
      console.error('Failed to add provider:', error)
      toast.error(error.message || 'Failed to add provider', {
        position: 'bottom-right',
        autoClose: 3000
      })
    }
  }

  /**
   * Remove a provider configuration
   */
  async function handleRemoveProvider(provider) {
    try {
      const response = await fetch(`/api/ai/providers/${provider.providerType}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove provider')
      }

      await fetchUserProviders()
      setShowDeleteDialog(false)
      toast.success(`Removed ${PROVIDER_INFO[provider.providerType].displayName} provider`, {
        position: 'bottom-right',
        autoClose: 3000
      })
    } catch (error) {
      console.error('Failed to remove provider:', error)
      toast.error(error.message || 'Failed to remove provider', {
        position: 'bottom-right',
        autoClose: 3000
      })
    }
  }

  /**
   * Update a provider configuration
   */
  async function handleUpdateProvider(provider) {
    const config = {
      ...provider,
      model: formData.model || PROVIDER_INFO[provider.providerType].defaultModel,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      options: JSON.stringify(formData.options || {}),
      isActive: formData.isActive
    }

    try {
      const response = await fetch(`/api/ai/providers/${provider.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update provider')
      }

      await fetchUserProviders()
      setEditingProvider(null)
      toast.success(`Updated ${PROVIDER_INFO[provider.providerType].displayName} provider`, {
        position: 'bottom-right',
        autoClose: 3000
      })
    } catch (error) {
      console.error('Failed to update provider:', error)
      toast.error(error.message || 'Failed to update provider', {
        position: 'bottom-right',
        autoClose: 3000
      })
    }
  }

  /**
   * Test provider connection
   */
  async function testProviderConnection(provider) {
    try {
      const response = await fetch(`/api/ai/health/${provider.providerType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Provider health check failed')
      }

      const health = await response.json()
      toast.success(
        health.status === 'healthy'
          ? `${PROVIDER_INFO[provider.providerType].displayName} provider is healthy`
          : `${PROVIDER_INFO[provider.providerType].displayName} provider is unhealthy`,
        {
          position: 'bottom-right',
          autoClose: 3000
        }
      )
    } catch (error) {
      console.error('Failed to test provider connection:', error)
      toast.error(error.message || 'Failed to test provider connection', {
        position: 'bottom-right',
        autoClose: 3000
      })
    }
  }

  /**
   * Activate a provider
   */
  async function handleActivateProvider(provider) {
    try {
      const response = await fetch(`/api/ai/providers/${provider.providerType}/activate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          providerId: provider.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to activate provider')
      }

      await fetchUserProviders()
      toast.success(`Activated ${PROVIDER_INFO[provider.providerType].displayName} provider`, {
        position: 'bottom-right',
        autoClose: 3000
      })
    } catch (error) {
      console.error('Failed to activate provider:', error)
      toast.error(error.message || 'Failed to activate provider', {
        position: 'bottom-right',
        autoClose: 3000
      })
    }
  }

  /**
   * Deactivate a provider
   */
  async function handleDeactivateProvider(provider) {
    try {
      const response = await fetch(`/api/ai/providers/${provider.providerType}/deactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deactivate provider')
      }

      await fetchUserProviders()
      toast.success(`Deactivated ${PROVIDER_INFO[provider.providerType].displayName} provider`, {
        position: 'bottom-right',
        autoClose: 3000
      })
    } catch (error) {
      console.error('Failed to deactivate provider:', error)
      toast.error(error.message || 'Failed to deactivate provider', {
        position: 'bottom-right',
        autoClose: 3000
      })
    }
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              AI Provider Settings
            </h2>
            <p className="text-sm text-gray-600">
              Manage your AI providers and API keys. All data is encrypted and stored securely.
            </p>
          </div>

          {/* Add Provider Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span className="font-medium">Add Provider</span>
            </button>
          </div>

          {/* Providers List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCwIcon className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading providers...</span>
              </div>
            ) : userProviders.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <KeyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No providers configured</p>
                <p className="text-sm text-gray-500 mb-4">
                  Add your AI provider credentials to use features like image generation and streaming.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userProviders.map(provider => (
                  <div 
                    key={provider.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-3">
                        {PROVIDER_INFO[provider.providerType] && (
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center`}
                            style={{ backgroundColor: PROVIDER_INFO[provider.providerType].color }}
                          >
                            {PROVIDER_INFO[provider.providerType].icon}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {PROVIDER_INFO[provider.providerType].displayName}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {provider.model || PROVIDER_INFO[provider.providerType].defaultModel}
                          </p>
                        </div>
                        <div className="flex items-center space-2">
                          {provider.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              <CheckIcon className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <button
                              onClick={() => handleActivateProvider(provider)}
                              className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full hover:bg-blue-700"
                            >
                              Activate
                            </button>
                          )}
                          <span className="text-xs text-gray-400">•</span>
                        </div>
                      </div>

                      <div className="flex items-center space-2">
                        <button
                          onClick={() => setEditingProvider(provider)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <KeyIcon className="w-4 h-4" />
                          Configure
                        </button>
                        <button
                          onClick={() => setShowDeleteDialog(provider)}
                          className="p-1.5 text-red-600 hover:text-red-700 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => testProviderConnection(provider)}
                          disabled={loading}
                          className="p-1.5 text-gray-600 hover:text-gray-700 transition-colors disabled:opacity-50"
                          title="Test provider connection"
                        >
                          <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Provider Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProvider ? 'Edit Provider' : 'Add New Provider'}
              </h2>
              <button
                onClick={() => {
                  setShowAddDialog(false)
                  setEditingProvider(null)
                  setFormData(DEFAULT_CONFIG)
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Provider Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider Type
                </label>
                <select
                  value={formData.providerType}
                  onChange={e => setFormData(prev => ({ ...prev, providerType: e.target.value })) }
                  disabled={!!editingProvider}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Select a provider...</option>
                  <option value={PROVIDER_TYPES.GEMINI}>Gemini</option>
                  <option value={PROVIDER_TYPES.ZAI}>Z.ai</option>
                  <option value={PROVIDER_TYPES.OLLAMA}>Ollama (Local)</option>
                </select>
              </div>

              {/* Provider Info */}
              {formData.providerType && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-3 mb-3">
                    {PROVIDER_INFO[formData.providerType].icon}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {PROVIDER_INFO[formData.providerType].displayName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {PROVIDER_INFO[formData.providerType].description}
                      </p>
                      <a 
                        href={PROVIDER_INFO[formData.providerType].docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Learn more
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Model Selection */}
              {formData.providerType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={e => setFormData(prev => ({ ...prev, model: e.target.value })) }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  >
                    {PROVIDER_INFO[formData.providerType].supportedModels.map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Base URL */}
              {formData.providerType === PROVIDER_TYPES.ZAI && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.baseUrl}
                    onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    placeholder={PROVIDER_INFO[PROVIDER_TYPES.ZAI].defaultModel === '4.5-air' 
                      ? 'https://api.z.ai/v1' 
                      : 'https://api.z.ai' || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              )}

              {/* Advanced Options */}
              <div className="mt-4 space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Advanced Options
                </h4>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Temperature ({PROVIDER_INFO[formData.providerType]?.options?.temperature || 0.7})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.options?.temperature || 0.7}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, temperature: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                  />

                  <label className="block text-sm font-medium text-gray-700">
                    Max Tokens ({formData.options?.maxTokens || 2048})
                  </label>
                  <input
                    type="number"
                    min="256"
                    max="8192"
                    step="256"
                    value={formData.options?.maxTokens || 2048}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, maxTokens: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />

                  <label className="block text-sm font-medium text-gray-700">
                    Top P ({formData.options?.topP || 0.9})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.options?.topP || 0.9}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, topP: parseFloat(e.target.value) }
                    }))}
                    className="w-full"
                  />

                  <label className="block text-sm font-medium text-gray-700">
                    Top K ({formData.options?.topK || 40})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.options?.topK || 40}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, topK: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-3 pt-6">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => editingProvider ? handleUpdateProvider(editingProvider) : handleAddProvider(editingProvider)}
                  disabled={loading || !formData.apiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Saving...' : editingProvider ? 'Update Provider' : 'Add Provider'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && editingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrashIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Remove Provider
                </h2>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to remove <strong>{PROVIDER_INFO[editingProvider.providerType].displayName}</strong>? 
                  This will disable all functionality for this provider.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs text-gray-500 mb-4">
                Provider ID: {editingProvider.id}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Provider Type: {editingProvider.providerType}
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Model: {editingProvider.model}
              </div>
            </div>

            <div className="flex justify-end space-3 pt-6">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveProvider(editingProvider)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderSettings