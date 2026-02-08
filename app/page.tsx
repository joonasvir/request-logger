'use client'

import { useEffect, useState } from 'react'
import Navigation from './components/Navigation'

interface LoggedRequest {
  id: string
  method: string
  headers: Record<string, string>
  body: any
  timestamp: string
  ip: string
  url: string
  // Email-specific fields
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  emailTo?: string[]
  emailType?: string
  isEmail?: boolean
}

export default function Home() {
  const [requests, setRequests] = useState<LoggedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LoggedRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [emailTypeFilter, setEmailTypeFilter] = useState('ALL')
  const [contentTypeFilter, setContentTypeFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<LoggedRequest | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/log')
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRequests, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    let filtered = requests

    if (methodFilter !== 'ALL') {
      filtered = filtered.filter(req => req.method === methodFilter)
    }

    if (emailTypeFilter !== 'ALL') {
      filtered = filtered.filter(req => req.emailType === emailTypeFilter)
    }

    if (contentTypeFilter !== 'ALL') {
      if (contentTypeFilter === 'EMAIL') {
        filtered = filtered.filter(req => req.isEmail)
      } else if (contentTypeFilter === 'API') {
        filtered = filtered.filter(req => !req.isEmail)
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        return (
          req.method.toLowerCase().includes(searchLower) ||
          req.url.toLowerCase().includes(searchLower) ||
          req.ip.toLowerCase().includes(searchLower) ||
          (req.emailSubject?.toLowerCase().includes(searchLower)) ||
          (req.emailBody?.toLowerCase().includes(searchLower)) ||
          (req.emailFrom?.toLowerCase().includes(searchLower)) ||
          (req.emailTo?.some(email => email.toLowerCase().includes(searchLower))) ||
          JSON.stringify(req.body).toLowerCase().includes(searchLower) ||
          JSON.stringify(req.headers).toLowerCase().includes(searchLower)
        )
      })
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, methodFilter, emailTypeFilter, contentTypeFilter])

  const clearRequests = async () => {
    try {
      await fetch('/api/log', { method: 'DELETE' })
      setRequests([])
      setSelectedRequest(null)
    } catch (error) {
      console.error('Failed to clear requests:', error)
    }
  }

  const getMethodBadgeClass = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'badge badge-get'
      case 'POST': return 'badge badge-post'
      case 'PUT': return 'badge badge-put'
      case 'DELETE': return 'badge badge-delete'
      default: return 'badge badge-default'
    }
  }

  const getEmailTypeBadgeClass = (type?: string) => {
    if (!type) return 'badge badge-default'
    switch (type.toLowerCase()) {
      case 'received': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'sent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default: return 'badge badge-default'
    }
  }

  const emailTypes = [...new Set(requests.filter(r => r.emailType).map(r => r.emailType))]
  const emailCount = requests.filter(r => r.isEmail).length
  const apiCount = requests.filter(r => !r.isEmail).length

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Request & Email Logger
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and debug HTTP requests and email data in real-time
          </p>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />

            {/* Content Type Filter */}
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">All Types</option>
              <option value="EMAIL">📨 Emails ({emailCount})</option>
              <option value="API">🔌 API Requests ({apiCount})</option>
            </select>

            {/* Email Type Filter */}
            <select
              value={emailTypeFilter}
              onChange={(e) => setEmailTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={contentTypeFilter !== 'EMAIL' && contentTypeFilter !== 'ALL'}
            >
              <option value="ALL">All Email Types</option>
              {emailTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
              <option value="received">Received</option>
              <option value="sent">Sent</option>
              <option value="draft">Draft</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>

            {/* Auto Refresh */}
            <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Auto Refresh</span>
            </label>
          </div>

          {/* Actions */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={clearRequests}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm flex-wrap gap-2">
              <span className="text-gray-600 dark:text-gray-400">
                Total: <strong className="text-gray-900 dark:text-white">{requests.length}</strong>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Emails: <strong className="text-blue-600 dark:text-blue-400">{emailCount}</strong>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                API: <strong className="text-green-600 dark:text-green-400">{apiCount}</strong>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Filtered: <strong className="text-gray-900 dark:text-white">{filteredRequests.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Requests List */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Requests ({filteredRequests.length})
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No requests logged yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Send a request to <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">/api/log</code>
                  </p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`request-card cursor-pointer ${
                      selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {req.isEmail ? (
                      // Email Display
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex gap-2">
                            <span className="badge badge-post">📨 EMAIL</span>
                            {req.emailType && (
                              <span className={`badge ${getEmailTypeBadgeClass(req.emailType)}`}>
                                {req.emailType.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(req.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {req.emailSubject || 'No Subject'}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            <strong>From:</strong> {req.emailFrom || 'Unknown'}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400">
                            <strong>To:</strong> {req.emailTo?.join(', ') || 'Unknown'}
                          </div>
                          {req.emailBody && (
                            <div className="text-gray-500 dark:text-gray-500 text-xs mt-2 truncate">
                              {req.emailBody.substring(0, 100)}{req.emailBody.length > 100 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // API Request Display
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <span className={getMethodBadgeClass(req.method)}>{req.method}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(req.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          <strong>URL:</strong> {req.url}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>IP:</strong> {req.ip}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Details
            </h2>
            {selectedRequest ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  {selectedRequest.isEmail ? (
                    // Email Details View
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          📨 Email Message
                          {selectedRequest.emailType && (
                            <span className={`badge text-xs ${getEmailTypeBadgeClass(selectedRequest.emailType)}`}>
                              {selectedRequest.emailType.toUpperCase()}
                            </span>
                          )}
                        </h3>
                        <div className="space-y-3">
                          <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Subject</div>
                            <div className="text-lg font-semibold text-gray-900 dark:text-white">
                              {selectedRequest.emailSubject || 'No Subject'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</div>
                            <div className="text-sm text-gray-900 dark:text-white font-mono">
                              {selectedRequest.emailFrom || 'Unknown'}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">To</div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {selectedRequest.emailTo?.map((email, i) => (
                                <div key={i} className="font-mono">{email}</div>
                              )) || 'Unknown'}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Timestamp</div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {new Date(selectedRequest.timestamp).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Message Body</div>
                            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded text-sm text-gray-900 dark:text-white whitespace-pre-wrap max-h-64 overflow-y-auto">
                              {selectedRequest.emailBody || 'No body content'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Technical Details</h3>
                        <div className="space-y-2 text-xs">
                          <div><strong>Request ID:</strong> {selectedRequest.id}</div>
                          <div><strong>Method:</strong> {selectedRequest.method}</div>
                          <div><strong>IP:</strong> {selectedRequest.ip}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // API Request Details View
                    <>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Request Info</h3>
                        <div className="space-y-2 text-sm">
                          <div><strong>ID:</strong> {selectedRequest.id}</div>
                          <div><strong>Method:</strong> <span className={getMethodBadgeClass(selectedRequest.method)}>{selectedRequest.method}</span></div>
                          <div><strong>URL:</strong> {selectedRequest.url}</div>
                          <div><strong>IP:</strong> {selectedRequest.ip}</div>
                          <div><strong>Timestamp:</strong> {new Date(selectedRequest.timestamp).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Headers</h3>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedRequest.headers, null, 2)}
                        </pre>
                      </div>

                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Body</h3>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedRequest.body, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}

                  {selectedRequest.isEmail && selectedRequest.body && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <details className="cursor-pointer">
                        <summary className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Raw Request Body</summary>
                        <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto mt-2">
                          {JSON.stringify(selectedRequest.body, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* API Usage */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-2">
              🔌 API Request Example
            </h3>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-300">
              <p><strong>Test regular API requests:</strong></p>
              <pre className="block bg-green-100 dark:bg-green-900/40 p-3 rounded mt-1 overflow-x-auto text-xs">{
`curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{"test": "data", "message": "Hello"}'`
              }</pre>
            </div>
          </div>

          {/* Email Usage */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
              📨 Email Data Example
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
              <p><strong>Log email data:</strong></p>
              <pre className="block bg-blue-100 dark:bg-blue-900/40 p-3 rounded mt-1 overflow-x-auto text-xs">{
`curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
    "emailSubject": "Meeting Tomorrow",
    "emailBody": "Let's meet at 2pm...",
    "emailFrom": "alice@example.com",
    "emailTo": ["bob@example.com"],
    "emailType": "sent"
  }'`
              }</pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
