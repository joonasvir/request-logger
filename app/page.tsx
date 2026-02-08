'use client'

import { useEffect, useState, useMemo } from 'react'
import Navigation from './components/Navigation'
import UserStats from './components/UserStats'
import { getRelativeTime, formatTimestamp } from './utils/timeUtils'

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
  emailType?: string
  isEmail?: boolean
  senderName?: string
  senderId?: string
  sessionId?: string
  deviceInfo?: string
}

export default function Home() {
  const [requests, setRequests] = useState<LoggedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LoggedRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [emailTypeFilter, setEmailTypeFilter] = useState('ALL')
  const [contentTypeFilter, setContentTypeFilter] = useState('ALL')
  const [recipientFilter, setRecipientFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<LoggedRequest | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [showUserStats, setShowUserStats] = useState(false)
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Update current time every 10 seconds for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedUser !== 'ALL') params.append('senderId', selectedUser)
      
      const url = `/api/log${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [selectedUser])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRequests, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedUser])

  // Extract unique recipients
  const allRecipients = useMemo(() => {
    const recipients = new Set<string>()
    requests.forEach(req => {
      req.emailTo?.forEach(email => recipients.add(email))
    })
    return Array.from(recipients).sort()
  }, [requests])

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

    if (recipientFilter !== 'ALL') {
      filtered = filtered.filter(req => req.emailTo?.includes(recipientFilter))
    }

    if (searchTerm) {
      filtered = filtered.filter(req => {
        const searchLower = searchTerm.toLowerCase()
        return (
          req.method.toLowerCase().includes(searchLower) ||
          req.url.toLowerCase().includes(searchLower) ||
          req.ip.toLowerCase().includes(searchLower) ||
          req.senderName?.toLowerCase().includes(searchLower) ||
          req.senderId?.toLowerCase().includes(searchLower) ||
          req.emailSubject?.toLowerCase().includes(searchLower) ||
          req.emailBody?.toLowerCase().includes(searchLower) ||
          req.emailFrom?.toLowerCase().includes(searchLower) ||
          req.emailTo?.some(email => email.toLowerCase().includes(searchLower)) ||
          JSON.stringify(req.body).toLowerCase().includes(searchLower) ||
          JSON.stringify(req.headers).toLowerCase().includes(searchLower)
        )
      })
    }

    setFilteredRequests(filtered)
  }, [requests, searchTerm, methodFilter, emailTypeFilter, contentTypeFilter, recipientFilter])

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

  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  const getUserColor = (id?: string) => {
    if (!id) return 'bg-gray-500'
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500', 'bg-teal-500']
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const emailTypes = [...new Set(requests.filter(r => r.emailType).map(r => r.emailType))]
  const emailCount = requests.filter(r => r.isEmail).length
  const apiCount = requests.filter(r => !r.isEmail).length
  const hasUserData = requests.some(r => r.senderId || r.senderName)
  const recipientCount = allRecipients.length

  const sessionGroups = useMemo(() => {
    if (selectedUser === 'ALL') return []
    
    const groups = new Map<string, LoggedRequest[]>()
    filteredRequests.forEach(req => {
      const sessionKey = req.sessionId || 'no-session'
      if (!groups.has(sessionKey)) {
        groups.set(sessionKey, [])
      }
      groups.get(sessionKey)!.push(req)
    })
    
    return Array.from(groups.entries()).map(([sessionId, reqs]) => ({
      sessionId,
      requests: reqs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      startTime: new Date(Math.min(...reqs.map(r => new Date(r.timestamp).getTime()))),
      endTime: new Date(Math.max(...reqs.map(r => new Date(r.timestamp).getTime()))),
      count: reqs.length
    })).sort((a, b) => b.endTime.getTime() - a.endTime.getTime())
  }, [filteredRequests, selectedUser])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Request & Email Logger
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor and debug HTTP requests and email data in real-time
          </p>
        </div>

        <Navigation />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`${showUserStats && hasUserData ? 'lg:col-span-1' : 'hidden lg:hidden'}`}>
            {hasUserData && (
              <UserStats
                requests={requests}
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
              />
            )}
          </div>

          <div className={`${showUserStats && hasUserData ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                {hasUserData && (
                  <button
                    onClick={() => setShowUserStats(!showUserStats)}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    {showUserStats ? 'Hide' : 'Show'} User Stats
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />

                <select
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ALL">All Types</option>
                  <option value="EMAIL">📨 Emails ({emailCount})</option>
                  <option value="API">🔌 API ({apiCount})</option>
                </select>

                <select
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={emailCount === 0}
                >
                  <option value="ALL">All Recipients</option>
                  {allRecipients.map(recipient => (
                    <option key={recipient} value={recipient}>
                      {recipient.length > 25 ? recipient.substring(0, 25) + '...' : recipient}
                    </option>
                  ))}
                </select>

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
                </select>

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

                <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">Auto</span>
                </label>
              </div>

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

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    Total: <strong className="text-gray-900 dark:text-white">{requests.length}</strong>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Filtered: <strong className="text-gray-900 dark:text-white">{filteredRequests.length}</strong>
                  </span>
                  {recipientCount > 0 && (
                    <span className="text-gray-600 dark:text-gray-400">
                      Recipients: <strong className="text-purple-600 dark:text-purple-400">{recipientCount}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedUser !== 'ALL' && sessionGroups.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  Sessions ({sessionGroups.length})
                </h2>
                {sessionGroups.map(group => (
                  <details key={group.sessionId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md" open={sessionGroups.length === 1}>
                    <summary className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Session: {group.sessionId === 'no-session' ? 'No Session ID' : group.sessionId.substring(0, 12)}...
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {group.count} requests • {formatTimestamp(group.startTime.toISOString())}
                          </p>
                        </div>
                        <span className="text-2xl">▼</span>
                      </div>
                    </summary>
                    <div className="p-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
                      {group.requests.map(req => (
                        <div
                          key={req.id}
                          onClick={() => setSelectedRequest(req)}
                          className={`request-card cursor-pointer ${selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {req.senderId && (
                                <div className={`w-8 h-8 rounded-full ${getUserColor(req.senderId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                  {getInitials(req.senderName)}
                                </div>
                              )}
                              <span className={getMethodBadgeClass(req.method)}>{req.method}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {getRelativeTime(req.timestamp)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {new Date(req.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {req.url}
                          </div>
                          {req.emailTo && req.emailTo.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {req.emailTo.slice(0, 3).map((email, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                  {email}
                                </span>
                              ))}
                              {req.emailTo.length > 3 && (
                                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                  +{req.emailTo.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Requests ({filteredRequests.length})
                  </h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                    {filteredRequests.length === 0 ? (
                      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">No requests logged yet</p>
                      </div>
                    ) : (
                      filteredRequests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => setSelectedRequest(req)}
                          className={`request-card cursor-pointer ${selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {req.senderId && (
                                <div className={`w-8 h-8 rounded-full ${getUserColor(req.senderId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                  {getInitials(req.senderName)}
                                </div>
                              )}
                              <span className={getMethodBadgeClass(req.method)}>{req.method}</span>
                              {req.isEmail && (
                                <span className="badge badge-post text-xs">📨</span>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {getRelativeTime(req.timestamp)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {formatTimestamp(req.timestamp)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 truncate">
                            {req.emailSubject || req.url}
                          </div>
                          {req.senderName && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              <strong>From:</strong> {req.senderName}
                            </div>
                          )}
                          {req.emailTo && req.emailTo.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <strong>To:</strong>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {req.emailTo.slice(0, 3).map((email, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                                    {email}
                                  </span>
                                ))}
                                {req.emailTo.length > 3 && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                    +{req.emailTo.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
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
                        <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Request Details
                            </h3>
                            <div className="text-right">
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {getRelativeTime(selectedRequest.timestamp)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                {formatTimestamp(selectedRequest.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {selectedRequest.senderId && (
                          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full ${getUserColor(selectedRequest.senderId)} flex items-center justify-center text-white text-lg font-semibold`}>
                                {getInitials(selectedRequest.senderName)}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                  {selectedRequest.senderName || 'Anonymous User'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  ID: {selectedRequest.senderId.substring(0, 12)}...
                                </p>
                                {selectedRequest.deviceInfo && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {selectedRequest.deviceInfo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedRequest.emailTo && selectedRequest.emailTo.length > 0 && (
                          <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Recipients ({selectedRequest.emailTo.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {selectedRequest.emailTo.map((email, i) => (
                                <span key={i} className="text-sm px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                  {email}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Request Info</h3>
                          <div className="space-y-2 text-sm">
                            <div><strong>ID:</strong> {selectedRequest.id}</div>
                            <div><strong>Method:</strong> <span className={getMethodBadgeClass(selectedRequest.method)}>{selectedRequest.method}</span></div>
                            <div><strong>URL:</strong> {selectedRequest.url}</div>
                            <div><strong>IP:</strong> {selectedRequest.ip}</div>
                            <div><strong>Timestamp:</strong> {formatTimestamp(selectedRequest.timestamp)}</div>
                            {selectedRequest.sessionId && (
                              <div><strong>Session:</strong> {selectedRequest.sessionId.substring(0, 16)}...</div>
                            )}
                          </div>
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
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
