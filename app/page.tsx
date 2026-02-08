'use client'

import { useEffect, useState, useMemo } from 'react'
import Navigation from './components/Navigation'
import UserStats from './components/UserStats'
import RecipientFilter from './components/RecipientFilter'
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
  recipientName?: string
  recipientId?: string
  recipientEmail?: string
}

export default function Home() {
  const [requests, setRequests] = useState<LoggedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<LoggedRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [emailTypeFilter, setEmailTypeFilter] = useState('ALL')
  const [contentTypeFilter, setContentTypeFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState('ALL')
  const [selectedRecipient, setSelectedRecipient] = useState('ALL')
  const [selectedRequest, setSelectedRequest] = useState<LoggedRequest | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
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
      if (selectedUser !== 'ALL') params.append('senderId', selectedUser)
      if (selectedRecipient !== 'ALL') params.append('recipientId', selectedRecipient)
      
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
  }, [selectedUser, selectedRecipient])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchRequests, 2000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedUser, selectedRecipient])

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
          req.senderName?.toLowerCase().includes(searchLower) ||
          req.recipientName?.toLowerCase().includes(searchLower) ||
          req.recipientEmail?.toLowerCase().includes(searchLower) ||
          req.emailSubject?.toLowerCase().includes(searchLower) ||
          JSON.stringify(req.body).toLowerCase().includes(searchLower)
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

  const getRecipientColor = (id?: string) => {
    if (!id) return 'bg-gray-500'
    const colors = ['bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-violet-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500']
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const emailTypes = [...new Set(requests.filter(r => r.emailType).map(r => r.emailType))]
  const emailCount = requests.filter(r => r.isEmail).length
  const apiCount = requests.filter(r => !r.isEmail).length
  const hasUserData = requests.some(r => r.senderId || r.senderName)
  const hasRecipientData = requests.some(r => r.recipientId || r.recipientName || r.recipientEmail)

  return (
    <main className=\"min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6\">
      <div className=\"max-w-7xl mx-auto\">
        <div className=\"mb-6\">
          <h1 className=\"text-4xl font-bold text-gray-900 dark:text-white mb-2\">
            \ud83d\udd0d Request & Email Logger\n          </h1>\n          <p className=\"text-gray-600 dark:text-gray-400\">\n            Monitor and debug HTTP requests and email data in real-time\n          </p>\n        </div>\n\n        <Navigation />\n\n        {/* Filter Banner */}\n        {(selectedUser !== 'ALL' || selectedRecipient !== 'ALL') && (\n          <div className=\"bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6\">\n            <div className=\"flex items-center justify-between flex-wrap gap-2\">\n              <div className=\"flex items-center gap-4 flex-wrap\">\n                {selectedUser !== 'ALL' && (\n                  <div className=\"flex items-center gap-2\">\n                    <span className=\"text-sm text-blue-800 dark:text-blue-300\">From:</span>\n                    <div className=\"flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full\">\n                      <div className={`w-6 h-6 rounded-full ${getUserColor(selectedUser)} flex items-center justify-center text-white text-xs font-semibold`}>\n                        {getInitials(requests.find(r => r.senderId === selectedUser)?.senderName)}\n                      </div>\n                      <span className=\"text-sm font-medium text-gray-900 dark:text-white\">\n                        {requests.find(r => r.senderId === selectedUser)?.senderName || 'User'}\n                      </span>\n                    </div>\n                  </div>\n                )}\n                {selectedRecipient !== 'ALL' && (\n                  <div className=\"flex items-center gap-2\">\n                    <span className=\"text-sm text-blue-800 dark:text-blue-300\">For:</span>\n                    <div className=\"flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full\">\n                      <div className={`w-6 h-6 rounded-full ${getRecipientColor(selectedRecipient)} flex items-center justify-center text-white text-xs font-semibold`}>\n                        {getInitials(requests.find(r => r.recipientId === selectedRecipient)?.recipientName)}\n                      </div>\n                      <span className=\"text-sm font-medium text-gray-900 dark:text-white\">\n                        {requests.find(r => r.recipientId === selectedRecipient)?.recipientName || 'Recipient'}\n                      </span>\n                    </div>\n                  </div>\n                )}\n              </div>\n              <button\n                onClick={() => {\n                  setSelectedUser('ALL')\n                  setSelectedRecipient('ALL')\n                }}\n                className=\"text-sm text-blue-700 dark:text-blue-400 hover:underline\"\n              >\n                Clear filters\n              </button>\n            </div>\n          </div>\n        )}\n\n        <div className=\"grid grid-cols-1 lg:grid-cols-6 gap-6\">\n          {/* Sidebars */}\n          <div className={`space-y-6 ${\n            showUserStats && showRecipientFilter ? 'lg:col-span-2' :\n            (showUserStats || showRecipientFilter) ? 'lg:col-span-1' :\n            'hidden lg:hidden'\n          }`}>\n            {hasUserData && showUserStats && (\n              <UserStats\n                requests={requests}\n                selectedUser={selectedUser}\n                onUserSelect={setSelectedUser}\n              />\n            )}\n            {hasRecipientData && showRecipientFilter && (\n              <RecipientFilter\n                requests={requests}\n                selectedRecipient={selectedRecipient}\n                onRecipientSelect={setSelectedRecipient}\n              />\n            )}\n          </div>\n\n          <div className={`${\n            showUserStats && showRecipientFilter ? 'lg:col-span-4' :\n            (showUserStats || showRecipientFilter) ? 'lg:col-span-5' :\n            'lg:col-span-6'\n          }`}>\n            <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6\">\n              <div className=\"flex items-center justify-between mb-4 flex-wrap gap-2\">\n                <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white\">Filters</h3>\n                <div className=\"flex gap-2\">\n                  {hasUserData && (\n                    <button\n                      onClick={() => setShowUserStats(!showUserStats)}\n                      className=\"px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50\"\n                    >\n                      {showUserStats ? 'Hide' : 'Show'} Users\n                    </button>\n                  )}\n                  {hasRecipientData && (\n                    <button\n                      onClick={() => setShowRecipientFilter(!showRecipientFilter)}\n                      className=\"px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50\"\n                    >\n                      {showRecipientFilter ? 'Hide' : 'Show'} Recipients\n                    </button>\n                  )}\n                </div>\n              </div>\n\n              <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4\">\n                <input\n                  type=\"text\"\n                  placeholder=\"Search...\"\n                  value={searchTerm}\n                  onChange={(e) => setSearchTerm(e.target.value)}\n                  className=\"px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white\"\n                />\n\n                <select\n                  value={contentTypeFilter}\n                  onChange={(e) => setContentTypeFilter(e.target.value)}\n                  className=\"px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white\"\n                >\n                  <option value=\"ALL\">All Types</option>\n                  <option value=\"EMAIL\">\ud83d\udce8 Emails ({emailCount})</option>\n                  <option value=\"API\">\ud83d\udd0c API ({apiCount})</option>\n                </select>\n\n                <select\n                  value={emailTypeFilter}\n                  onChange={(e) => setEmailTypeFilter(e.target.value)}\n                  className=\"px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white\"\n                  disabled={contentTypeFilter !== 'EMAIL' && contentTypeFilter !== 'ALL'}\n                >\n                  <option value=\"ALL\">All Email Types</option>\n                  {emailTypes.map(type => (\n                    <option key={type} value={type}>{type}</option>\n                  ))}\n                </select>\n\n                <select\n                  value={methodFilter}\n                  onChange={(e) => setMethodFilter(e.target.value)}\n                  className=\"px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white\"\n                >\n                  <option value=\"ALL\">All Methods</option>\n                  <option value=\"GET\">GET</option>\n                  <option value=\"POST\">POST</option>\n                  <option value=\"PUT\">PUT</option>\n                  <option value=\"DELETE\">DELETE</option>\n                  <option value=\"PATCH\">PATCH</option>\n                </select>\n\n                <label className=\"flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700\">\n                  <input\n                    type=\"checkbox\"\n                    checked={autoRefresh}\n                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className=\"w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500\"
                  />
                  <span className=\"text-gray-700 dark:text-gray-300 text-sm\">Auto</span>
                </label>
              </div>

              <div className=\"mt-4 flex space-x-2\">
                <button
                  onClick={fetchRequests}
                  className=\"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors\"
                >
                  Refresh
                </button>
                <button
                  onClick={clearRequests}
                  className=\"px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors\"
                >
                  Clear All
                </button>
              </div>

              <div className=\"mt-4 pt-4 border-t border-gray-200 dark:border-gray-700\">
                <div className=\"flex items-center justify-between text-sm flex-wrap gap-2\">
                  <span className=\"text-gray-600 dark:text-gray-400\">
                    Total: <strong className=\"text-gray-900 dark:text-white\">{requests.length}</strong>
                  </span>
                  <span className=\"text-gray-600 dark:text-gray-400\">
                    Filtered: <strong className=\"text-gray-900 dark:text-white\">{filteredRequests.length}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
              <div>
                <h2 className=\"text-2xl font-semibold text-gray-900 dark:text-white mb-4\">
                  Requests ({filteredRequests.length})
                </h2>
                <div className=\"space-y-3 max-h-[600px] overflow-y-auto pr-2\">
                  {filteredRequests.length === 0 ? (
                    <div className=\"text-center py-12 bg-white dark:bg-gray-800 rounded-lg\">
                      <p className=\"text-gray-500 dark:text-gray-400\">No requests logged yet</p>
                    </div>
                  ) : (
                    filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`request-card cursor-pointer ${selectedRequest?.id === req.id ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className=\"flex items-start justify-between mb-2\">
                          <div className=\"flex items-center gap-2\">
                            {req.senderId && (
                              <div className={`w-8 h-8 rounded-full ${getUserColor(req.senderId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                {getInitials(req.senderName)}
                              </div>
                            )}
                            <span className={getMethodBadgeClass(req.method)}>{req.method}</span>
                            {req.isEmail && (
                              <span className=\"badge badge-post text-xs\">\ud83d\udce8</span>
                            )}
                          </div>
                          <div className=\"text-right\">
                            <div className=\"text-sm font-semibold text-blue-600 dark:text-blue-400\">
                              {getRelativeTime(req.timestamp)}
                            </div>
                            <div className=\"text-xs text-gray-500 dark:text-gray-500\">
                              {new Date(req.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </div>
                          </div>
                        </div>
                        <div className=\"text-sm text-gray-700 dark:text-gray-300 mb-1 font-medium truncate\">
                          {req.emailSubject || req.url}
                        </div>
                        <div className=\"flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap\">
                          {req.senderName && (
                            <span>\ud83d\udc64 From: <strong>{req.senderName}</strong></span>
                          )}
                          {req.recipientName && (
                            <span className=\"flex items-center gap-1\">
                              <div className={`w-4 h-4 rounded-full ${getRecipientColor(req.recipientId)} flex items-center justify-center text-white text-[8px] font-semibold`}>
                                {getInitials(req.recipientName)}
                              </div>
                              <span>For: <strong>{req.recipientName}</strong></span>
                            </span>
                          )}\n                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className=\"text-2xl font-semibold text-gray-900 dark:text-white mb-4\">Details</h2>
                {selectedRequest ? (
                  <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-6\">
                    <div className=\"space-y-4\">
                      {/* Timestamp Header */}
                      <div className=\"pb-4 border-b border-gray-200 dark:border-gray-700\">
                        <div className=\"flex items-center justify-between\">
                          <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white\">
                            Request Details
                          </h3>
                          <div className=\"text-right\">
                            <div className=\"text-lg font-semibold text-blue-600 dark:text-blue-400\">
                              {getRelativeTime(selectedRequest.timestamp)}
                            </div>
                            <div className=\"text-sm text-gray-600 dark:text-gray-400\">
                              {formatTimestamp(selectedRequest.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sender Info */}
                      {selectedRequest.senderId && (
                        <div className=\"pb-4 border-b border-gray-200 dark:border-gray-700\">
                          <h4 className=\"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2\">\ud83d\udc64 Sender</h4>
                          <div className=\"flex items-center gap-3\">
                            <div className={`w-12 h-12 rounded-full ${getUserColor(selectedRequest.senderId)} flex items-center justify-center text-white text-lg font-semibold`}>
                              {getInitials(selectedRequest.senderName)}
                            </div>
                            <div>
                              <p className=\"font-semibold text-gray-900 dark:text-white\">
                                {selectedRequest.senderName}
                              </p>
                              <p className=\"text-xs text-gray-600 dark:text-gray-400\">
                                ID: {selectedRequest.senderId.substring(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recipient Info */}
                      {selectedRequest.recipientId && (
                        <div className=\"pb-4 border-b border-gray-200 dark:border-gray-700\">
                          <h4 className=\"text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2\">\ud83d\udcec Recipient (For Whom)</h4>
                          <div className=\"flex items-center gap-3\">
                            <div className={`w-12 h-12 rounded-full ${getRecipientColor(selectedRequest.recipientId)} flex items-center justify-center text-white text-lg font-semibold`}>
                              {getInitials(selectedRequest.recipientName)}
                            </div>
                            <div>
                              <p className=\"font-semibold text-gray-900 dark:text-white\">
                                {selectedRequest.recipientName}
                              </p>\n                              {selectedRequest.recipientEmail && (
                                <p className=\"text-sm text-gray-600 dark:text-gray-400\">
                                  {selectedRequest.recipientEmail}
                                </p>
                              )}
                              <p className=\"text-xs text-gray-500 dark:text-gray-500\">
                                ID: {selectedRequest.recipientId.substring(0, 12)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">Request Info</h3>
                        <div className=\"space-y-2 text-sm\">
                          <div><strong>ID:</strong> {selectedRequest.id}</div>
                          <div><strong>Method:</strong> <span className={getMethodBadgeClass(selectedRequest.method)}>{selectedRequest.method}</span></div>
                          <div><strong>URL:</strong> {selectedRequest.url}</div>
                          <div><strong>Timestamp:</strong> {formatTimestamp(selectedRequest.timestamp)}</div>
                          {selectedRequest.sessionId && (
                            <div><strong>Session:</strong> {selectedRequest.sessionId.substring(0, 16)}...</div>
                          )}
                        </div>
                      </div>

                      <div className=\"pt-4 border-t border-gray-200 dark:border-gray-700\">
                        <h3 className=\"text-lg font-semibold text-gray-900 dark:text-white mb-2\">Body</h3>
                        <pre className=\"bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto max-h-96\">
                          {JSON.stringify(selectedRequest.body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className=\"bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center\">
                    <p className=\"text-gray-500 dark:text-gray-400\">Select a request to view details</p>
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
