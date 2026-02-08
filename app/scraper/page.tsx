'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import UserStats from '../components/UserStats'
import RecipientFilter from '../components/RecipientFilter'
import { getRelativeTime, formatTimestamp, formatShortTimestamp } from '../utils/timeUtils'

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
  senderName?: string
  senderId?: string
  sessionId?: string
  deviceInfo?: string
  recipientName?: string
  recipientId?: string
  recipientEmail?: string
}

export default function ScraperMonitor() {
  const [requests, setRequests] = useState<LoggedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LoggedRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState('ALL')
  const [selectedRecipient, setSelectedRecipient] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<LoggedRequest | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showUserStats, setShowUserStats] = useState(false)
  const [showRecipientFilter, setShowRecipientFilter] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams()
      params.append('isScraper', 'true')
      if (selectedUser !== 'ALL') params.append('senderId', selectedUser)
      if (selectedRecipient !== 'ALL') params.append('recipientId', selectedRecipient)
      
      const res = await fetch(`/api/log?${params.toString()}`)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [selectedUser, selectedRecipient])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRequests, 3000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedUser, selectedRecipient])

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
          req.senderName?.toLowerCase().includes(searchLower) ||
          req.recipientName?.toLowerCase().includes(searchLower)
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

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const getUserColor = (id?: string) => {
    if (!id) return 'bg-gray-500'
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getRecipientColor = (id?: string) => {
    if (!id) return 'bg-gray-500'
    const colors = ['bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500']
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const sources = [...new Set(requests.filter(r => r.source).map(r => r.source))]
  const successCount = requests.filter(r => r.scraperStatus === 'success').length
  const errorCount = requests.filter(r => r.scraperStatus === 'error').length
  const recentPings = requests.filter(r => {
    const timeDiff = Date.now() - new Date(r.timestamp).getTime()
    return timeDiff < 60000
  }).length

  const sourceMetrics = sources.map(source => ({
    source,
    count: requests.filter(r => r.source === source).length,
    success: requests.filter(r => r.source === source && r.scraperStatus === 'success').length,
    errors: requests.filter(r => r.source === source && r.scraperStatus === 'error').length,
  }))

  const hasUserData = requests.some(r => r.senderId || r.senderName)
  const hasRecipientData = requests.some(r => r.recipientId || r.recipientName)

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📰 News Scraper Monitor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of scraped news content and app activity
          </p>
        </div>

        <Navigation />

        {(selectedUser !== 'ALL' || selectedRecipient !== 'ALL') && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                {selectedUser !== 'ALL' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Scraped by:</span>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                      <div className={`w-6 h-6 rounded-full ${getUserColor(selectedUser)} flex items-center justify-center text-white text-xs font-semibold`}>
                        {getInitials(requests.find(r => r.senderId === selectedUser)?.senderName)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {requests.find(r => r.senderId === selectedUser)?.senderName}
                      </span>
                    </div>
                  </div>
                )}
                {selectedRecipient !== 'ALL' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">For:</span>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full">
                      <div className={`w-6 h-6 rounded-full ${getRecipientColor(selectedRecipient)} flex items-center justify-center text-white text-xs font-semibold`}>
                        {getInitials(requests.find(r => r.recipientId === selectedRecipient)?.recipientName)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {requests.find(r => r.recipientId === selectedRecipient)?.recipientName}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedUser('ALL')
                  setSelectedRecipient('ALL')
                }}
                className="text-sm text-blue-700 dark:text-blue-400 hover:underline"
              >
                Clear filters
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          <div className={`space-y-6 ${
            showUserStats && showRecipientFilter ? 'lg:col-span-2' :
            (showUserStats || showRecipientFilter) ? 'lg:col-span-1' :
            'hidden lg:hidden'
          }`}>
            {hasUserData && showUserStats && (
              <UserStats
                requests={requests}
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
              />
            )}
            {hasRecipientData && showRecipientFilter && (
              <RecipientFilter
                requests={requests}
                selectedRecipient={selectedRecipient}
                onRecipientSelect={setSelectedRecipient}
              />
            )}
          </div>

          <div className={`${
            showUserStats && showRecipientFilter ? 'lg:col-span-4' :
            (showUserStats || showRecipientFilter) ? 'lg:col-span-5' :
            'lg:col-span-6'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{requests.length}</p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Success</p>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recent</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{recentPings}</p>
                    <p className="text-xs text-gray-500">60s</p>
                  </div>
                  <div className="text-4xl">📡</div>
                </div>
              </div>
            </div>

            {sourceMetrics.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sources</h2>
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
                          <span className="font-semibold">{metric.count}</span>
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                <div className="flex gap-2">
                  {hasUserData && (
                    <button
                      onClick={() => setShowUserStats(!showUserStats)}
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                    >
                      {showUserStats ? 'Hide' : 'Show'} Users
                    </button>
                  )}
                  {hasRecipientData && (
                    <button
                      onClick={() => setShowRecipientFilter(!showRecipientFilter)}
                      className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
                    >
                      {showRecipientFilter ? 'Hide' : 'Show'} Recipients
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search scrapes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />

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

                <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Auto (3s)</span>
                </label>
              </div>

              <div className="mt-4 flex space-x-2">
                <button onClick={fetchRequests} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Refresh
                </button>
                <button onClick={clearRequests} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Scraped Content ({filteredRequests.length})
                </h2>
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                      <p className="text-gray-500 dark:text-gray-400">No scraper data logged yet</p>
                    </div>
                  ) : (
                    filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`request-card cursor-pointer ${selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex gap-2 items-center flex-wrap">
                            {req.senderId && (
                              <div className={`w-8 h-8 rounded-full ${getUserColor(req.senderId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                {getInitials(req.senderName)}
                              </div>
                            )}
                            {req.recipientId && (
                              <div className={`w-8 h-8 rounded-full ${getRecipientColor(req.recipientId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                {getInitials(req.recipientName)}
                              </div>
                            )}
                            <span className="text-2xl">{getSourceIcon(req.source)}</span>
                          </div>
                          <div className="text-right">
                            <span className={`badge text-xs ${getStatusBadgeClass(req.scraperStatus)}`}>
                              {req.scraperStatus?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                              {getRelativeTime(req.scrapedAt || req.timestamp)}
                            </div>
                          </div>
                        </div>

                        <div className="font-semibold text-gray-900 dark:text-white">{req.source || 'Unknown'}</div>
                        {req.emailSubject && (
                          <div className="font-medium text-gray-900 dark:text-white text-sm mt-1">
                            {req.emailSubject}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {req.senderName && (
                            <span>👤 {req.senderName}</span>
                          )}
                          {req.recipientName && (
                            <span>📬 For: {req.recipientName}</span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatShortTimestamp(req.scrapedAt || req.timestamp)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Details</h2>
                {selectedRequest ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{getSourceIcon(selectedRequest.source)}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {selectedRequest.source || 'Unknown'}
                            </h3>
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                              {getRelativeTime(selectedRequest.scrapedAt || selectedRequest.timestamp)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTimestamp(selectedRequest.scrapedAt || selectedRequest.timestamp)}
                            </div>
                          </div>
                        </div>
                        <span className={`badge ${getStatusBadgeClass(selectedRequest.scraperStatus)}`}>
                          {selectedRequest.scraperStatus?.toUpperCase()}
                        </span>
                      </div>

                      {selectedRequest.senderId && (
                        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">👤 Scraped By</h4>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${getUserColor(selectedRequest.senderId)} flex items-center justify-center text-white font-semibold`}>
                              {getInitials(selectedRequest.senderName)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.senderName}</p>
                              <p className="text-xs text-gray-500">{selectedRequest.deviceInfo}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.recipientId && (
                        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">📬 For Whom</h4>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${getRecipientColor(selectedRequest.recipientId)} flex items-center justify-center text-white font-semibold`}>
                              {getInitials(selectedRequest.recipientName)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.recipientName}</p>
                              {selectedRequest.recipientEmail && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.recipientEmail}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedRequest.emailSubject && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</h4>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">{selectedRequest.emailSubject}</p>
                        </div>
                      )}

                      {selectedRequest.emailBody && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Content</h4>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                            <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                              {selectedRequest.emailBody}
                            </div>
                          </div>
                        </div>
                      )}

                      <details className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">Technical Details</summary>
                        <div className="mt-3 space-y-2 text-xs">
                          <div><strong>ID:</strong> {selectedRequest.id}</div>
                          <div><strong>Timestamp:</strong> {formatTimestamp(selectedRequest.timestamp)}</div>
                          {selectedRequest.sessionId && (
                            <div><strong>Session:</strong> {selectedRequest.sessionId}</div>
                          )}
                        </div>
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
          </div>
        </div>
      </div>
    </main>
  )

  function getSourceIcon(source?: string): string {
    if (!source) return '📰'
    const lower = source.toLowerCase()
    if (lower.includes('nyt') || lower.includes('times')) return '🗓️'
    if (lower.includes('atlantic')) return '🌊'
    if (lower.includes('post')) return '📬'
    if (lower.includes('guardian')) return '🛡️'
    if (lower.includes('cooking')) return '🍳'
    return '📰'
  }
}
