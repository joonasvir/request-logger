'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import UserStats from '../components/UserStats'
import RecipientStats from '../components/RecipientStats'
import { getRelativeTime, formatTimestamp } from '../utils/timeUtils'

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
  const [showRecipientStats, setShowRecipientStats] = useState(false)
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
          req.emailBody?.toLowerCase().includes(searchLower) ||
          req.articleUrl?.toLowerCase().includes(searchLower) ||
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
    const colors = ['bg-purple-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-rose-500']
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
  const hasRecipientData = requests.some(r => r.recipientId || r.recipientName || r.recipientEmail)

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
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                {selectedUser !== 'ALL' && (
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    👥 Scraped by: <strong>{requests.find(r => r.senderId === selectedUser)?.senderName || 'User'}</strong>
                  </span>
                )}
                {selectedRecipient !== 'ALL' && (
                  <span className="text-sm text-purple-800 dark:text-purple-300">
                    👤 For: <strong>{requests.find(r => r.recipientId === selectedRecipient)?.recipientName || 'Recipient'}</strong>
                  </span>
                )}
              </div>
              <button
                onClick={() => { setSelectedUser('ALL'); setSelectedRecipient('ALL') }}
                className="text-sm text-blue-700 dark:text-blue-400 hover:underline"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {showUserStats && hasUserData && (
            <div className="lg:col-span-1">
              <UserStats
                requests={requests}
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
              />
            </div>
          )}
          
          {showRecipientStats && hasRecipientData && (
            <div className="lg:col-span-1">
              <RecipientStats
                requests={requests}
                selectedRecipient={selectedRecipient}
                onRecipientSelect={setSelectedRecipient}
              />
            </div>
          )}

          <div className={`lg:col-span-${6 - (showUserStats && hasUserData ? 1 : 0) - (showRecipientStats && hasRecipientData ? 1 : 0)}`}>
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recent</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{recentPings}</p>
                    <p className="text-xs text-gray-500">Last 60s</p>
                  </div>
                  <div className="text-4xl">📡</div>
                </div>
              </div>
            </div>

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
                          <span className="font-semibold">{metric.success}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-red-600 dark:text-red-400">Errors:</span>
                          <span className="font-semibold">{metric.errors}</span>
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
                      className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg"
                    >
                      {showUserStats ? 'Hide' : 'Show'} Users
                    </button>
                  )}
                  {hasRecipientData && (
                    <button
                      onClick={() => setShowRecipientStats(!showRecipientStats)}
                      className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg"
                    >
                      {showRecipientStats ? 'Hide' : 'Show'} Recipients
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Search..."
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

                <button
                  onClick={fetchRequests}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh
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
                          <div className="flex gap-2 items-center">
                            {req.senderId && (
                              <div className={`w-8 h-8 rounded-full ${getUserColor(req.senderId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                {getInitials(req.senderName)}
                              </div>
                            )}
                            {req.recipientId && (
                              <div className={`w-8 h-8 rounded-full ${getRecipientColor(req.recipientId)} flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-gray-800`}>
                                {getInitials(req.recipientName)}
                              </div>
                            )}
                            <span className="text-2xl">{getSourceIcon(req.source)}</span>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{req.source || 'Unknown'}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {req.senderName && `👥 ${req.senderName}`}
                                {req.senderName && req.recipientName && ' • '}
                                {req.recipientName && `👤 For: ${req.recipientName}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`badge text-xs ${getStatusBadgeClass(req.scraperStatus)}`}>
                              {req.scraperStatus?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                              {getRelativeTime(req.scrapedAt || req.timestamp)}
                            </div>
                          </div>
                        </div>

                        {req.emailSubject && (
                          <div className="mb-2 font-medium text-gray-900 dark:text-white text-sm">
                            {req.emailSubject}
                          </div>
                        )}

                        {req.articleUrl && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 truncate mb-2">
                            🔗 {req.articleUrl}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  Content Details
                </h2>
                {selectedRequest ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{getSourceIcon(selectedRequest.source)}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                              {selectedRequest.source || 'Unknown Source'}
                            </h3>
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                              {getRelativeTime(selectedRequest.scrapedAt || selectedRequest.timestamp)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTimestamp(selectedRequest.scrapedAt || selectedRequest.timestamp)}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${getStatusBadgeClass(selectedRequest.scraperStatus)}`}>
                          {selectedRequest.scraperStatus?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>

                      {(selectedRequest.senderId || selectedRequest.recipientId) && (
                        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">People</h4>
                          <div className="space-y-3">
                            {selectedRequest.senderId && (
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${getUserColor(selectedRequest.senderId)} flex items-center justify-center text-white font-semibold`}>
                                  {getInitials(selectedRequest.senderName)}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Scraped by</p>
                                  <p className="font-semibold text-gray-900 dark:text-white">
                                    {selectedRequest.senderName}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedRequest.recipientId && (
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${getRecipientColor(selectedRequest.recipientId)} flex items-center justify-center text-white font-semibold`}>
                                  {getInitials(selectedRequest.recipientName)}
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">For recipient</p>
                                  <p className="font-semibold text-purple-900 dark:text-purple-100">
                                    {selectedRequest.recipientName}
                                  </p>
                                  {selectedRequest.recipientEmail && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {selectedRequest.recipientEmail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedRequest.emailSubject && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Subject</h4>
                          <p className="text-lg font-medium text-gray-900 dark:text-white">
                            {selectedRequest.emailSubject}
                          </p>
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
                        <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                          Technical Details
                        </summary>
                        <div className="mt-3 space-y-2 text-xs">
                          <div><strong>ID:</strong> {selectedRequest.id}</div>
                          <div><strong>Timestamp:</strong> {formatTimestamp(selectedRequest.timestamp)}</div>
                          {selectedRequest.sessionId && (
                            <div><strong>Session:</strong> {selectedRequest.sessionId}</div>
                          )}
                          {selectedRequest.deviceInfo && (
                            <div><strong>Device:</strong> {selectedRequest.deviceInfo}</div>
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
}
