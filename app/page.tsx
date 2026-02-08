'use client'

import { useEffect, useState } from 'react'

interface LoggedRequest {
  id: string
  method: string
  headers: Record<string, string>
  body: any
  timestamp: string
  ip: string
  url: string
}

export default function Home() {
  const [requests, setRequests] = useState<LoggedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LoggedRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
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

    if (searchTerm) {
      filtered = filtered.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        return (
          req.method.toLowerCase().includes(searchLower) ||
          req.url.toLowerCase().includes(searchLower) ||
          req.ip.toLowerCase().includes(searchLower) ||
          JSON.stringify(req.body).toLowerCase().includes(searchLower) ||
          JSON.stringify(req.headers).toLowerCase().includes(searchLower)
        )
      })
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, methodFilter])

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Request Logger
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and debug HTTP requests in real-time
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />

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

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={fetchRequests}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={clearRequests}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Total Requests: <strong className="text-gray-900 dark:text-white">{requests.length}</strong>
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
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            📚 How to Use
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <p><strong>Test the API:</strong></p>
            <code className="block bg-blue-100 dark:bg-blue-900/40 p-3 rounded mt-1 overflow-x-auto text-xs">
              curl -X POST http://localhost:3000/api/log -H "Content-Type: application/json" -d '{'{'}"test": "data"{'}'}'            </code>
            <p className="mt-3">Requests will appear here automatically. Use search and filters to find specific requests.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
