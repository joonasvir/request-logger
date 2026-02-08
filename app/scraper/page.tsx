'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'

interface LoggedRequest {
  id: string
  method: string
  headers: Record<string, string>
  body: any
  timestamp: string
  ip: string
  url: string
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  emailTo?: string[]
  source?: string
  scraperStatus?: string
  articleUrl?: string
  scrapedAt?: string
  isScraper?: boolean
}

export default function ScraperMonitor() {
  const [requests, setRequests] = useState<LoggedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LoggedRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<LoggedRequest | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/log?isScraper=true')
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
      const interval = setInterval(fetchRequests, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  useEffect(() => {
    let filtered = requests

    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(req => req.source === sourceFilter)
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(req => req.scraperStatus === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        return (
          req.source?.toLowerCase().includes(searchLower) ||
          req.emailSubject?.toLowerCase().includes(searchLower) ||
          req.emailBody?.toLowerCase().includes(searchLower) ||
          req.articleUrl?.toLowerCase().includes(searchLower)
        )
      })
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, sourceFilter, statusFilter])

  const clearRequests = async () => {
    if (confirm('Clear all scraper logs?')) {
      try {
        await fetch('/api/log', { method: 'DELETE' })
        setRequests([])
        setSelectedRequest(null)
      } catch (error) {
        console.error('Failed to clear requests:', error)
      }
    }
  }

  const getStatusBadgeClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getSourceIcon = (source?: string) => {
    if (!source) return '📰'
    const lower = source.toLowerCase()
    if (lower.includes('nyt') || lower.includes('times')) return '🗓️'
    if (lower.includes('atlantic')) return '🌊'
    if (lower.includes('post')) return '📬'
    if (lower.includes('guardian')) return '🛡️'
    if (lower.includes('cooking')) return '🍳'
    return '📰'
  }

  const sources = [...new Set(requests.filter(r => r.source).map(r => r.source))]
  const successCount = requests.filter(r => r.scraperStatus === 'success').length
  const errorCount = requests.filter(r => r.scraperStatus === 'error').length
  const recentPings = requests.filter(r => {
    const timeDiff = Date.now() - new Date(r.timestamp).getTime()
    return timeDiff < 60000 // Last minute
  }).length

  // Group by source for metrics
  const sourceMetrics = sources.map(source => ({
    source,
    count: requests.filter(r => r.source === source).length,
    success: requests.filter(r => r.source === source && r.scraperStatus === 'success').length,
    errors: requests.filter(r => r.source === source && r.scraperStatus === 'error').length,
  }))

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📰 News Scraper Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of scraped news content and app activity
          </p>
        </div>

        {/* Navigation */}
        <Navigation />

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Scrapes</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{successCount}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{errorCount}</p>
              </div>
              <div className="text-4xl">❌</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Pings</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{recentPings}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Last 60s</p>
              </div>
              <div className="text-4xl">📡</div>
            </div>
          </div>
        </div>

        {/* Source Metrics */}
        {sourceMetrics.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">News Sources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sourceMetrics.map(metric => (
                <div key={metric.source} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getSourceIcon(metric.source)}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{metric.source}</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{metric.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400">Success:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">{metric.success}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 dark:text-red-400">Errors:</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">{metric.errors}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <input
              type="text"
              placeholder="Search scrapes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="ALL">All Status</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="pending">Pending</option>
            </select>

            {/* Auto Refresh */}
            <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">Auto Refresh (3s)</span>
            </label>
          </div>

          {/* Actions */}
          <div className="mt-4 flex space-x-2">
            <button
              onClick={fetchRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Now
            </button>
            <button
              onClick={clearRequests}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scrapes List */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Scraped Content ({filteredRequests.length})
            </h2>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No scraper data logged yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Send scraper data to <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">/api/log</code>
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
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2 items-center">
                        <span className="text-2xl">{getSourceIcon(req.source)}</span>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{req.source || 'Unknown Source'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(req.scrapedAt || req.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className={`badge text-xs ${getStatusBadgeClass(req.scraperStatus)}`}>
                        {req.scraperStatus?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </div>

                    {req.emailSubject && (
                      <div className="mb-2">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {req.emailSubject}
                        </div>
                      </div>
                    )}

                    {req.articleUrl && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 truncate mb-2">
                        🔗 {req.articleUrl}
                      </div>
                    )}

                    {req.emailBody && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {req.emailBody.substring(0, 150)}{req.emailBody.length > 150 ? '...' : ''}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Content Details */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Content Details
            </h2>
            {selectedRequest ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{getSourceIcon(selectedRequest.source)}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedRequest.source || 'Unknown Source'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(selectedRequest.scrapedAt || selectedRequest.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(selectedRequest.scraperStatus)}`}>
                      {selectedRequest.scraperStatus?.toUpperCase() || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Article Info */}
                  {selectedRequest.articleUrl && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Article URL</h4>
                      <a
                        href={selectedRequest.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {selectedRequest.articleUrl}
                      </a>
                    </div>
                  )}

                  {/* Email Subject */}
                  {selectedRequest.emailSubject && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</h4>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedRequest.emailSubject}
                      </p>
                    </div>
                  )}

                  {/* Email From */}
                  {selectedRequest.emailFrom && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">From</h4>
                      <p className="text-sm font-mono text-gray-900 dark:text-white">
                        {selectedRequest.emailFrom}
                      </p>
                    </div>
                  )}

                  {/* Content Body */}
                  {selectedRequest.emailBody && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</h4>
                      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="prose dark:prose-invert prose-sm max-w-none">
                          <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                            {selectedRequest.emailBody}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  <details className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Technical Details
                    </summary>
                    <div className="mt-3 space-y-2 text-xs">
                      <div><strong>Request ID:</strong> {selectedRequest.id}</div>
                      <div><strong>Timestamp:</strong> {selectedRequest.timestamp}</div>
                      <div><strong>Scraped At:</strong> {selectedRequest.scrapedAt || 'N/A'}</div>
                      <div><strong>IP:</strong> {selectedRequest.ip}</div>
                      <div><strong>Method:</strong> {selectedRequest.method}</div>
                    </div>
                  </details>

                  {/* Raw Data */}
                  <details className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                      Raw Request Data
                    </summary>
                    <pre className="mt-3 bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedRequest.body, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">Select a scrape to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
            📚 How to Send Scraper Data
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Example: Log scraped news email</p>
              <pre className="block bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded text-xs overflow-x-auto">{
`curl -X POST http://localhost:3000/api/log \\
  -H "Content-Type: application/json" \\
  -d '{
  "source": "NYT Cooking",
  "scraperStatus": "success",
  "articleUrl": "https://cooking.nytimes.com/recipes/12345",
  "scrapedAt": "2026-02-07T21:00:00Z",
  "emailSubject": "5 Weeknight Pasta Recipes",
  "emailBody": "Discover quick and delicious pasta recipes...",
  "emailFrom": "cooking@nytimes.com"
}'`
              }</pre>
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">Example: Log app ping</p>
              <pre className="block bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded text-xs overflow-x-auto">{
`curl -X POST http://localhost:3000/api/log \\
  -H "Content-Type: application/json" \\
  -d '{"source": "App Health Check", "scraperStatus": "success"}'`
              }</pre>
            </div>
            <div className="pt-3 border-t border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-indigo-800 dark:text-indigo-300">
                <strong>Supported sources:</strong> NYT Cooking, The Atlantic, Washington Post, The Guardian, or any custom source name
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
