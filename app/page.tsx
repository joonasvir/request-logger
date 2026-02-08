'use client'

import { useEffect, useState, useMemo } from 'react'
import Navigation from './components/Navigation'
import UserStats from './components/UserStats'
import RecipientStats from './components/RecipientStats'
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
  const [showRecipientStats, setShowRecipientStats] = useState(false)
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
    const colors = ['bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-violet-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500']
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const emailTypes = [...new Set(requests.filter(r => r.emailType).map(r => r.emailType))]
  const emailCount = requests.filter(r => r.isEmail).length
  const apiCount = requests.filter(r => !r.isEmail).length
  const hasUserData = requests.some(r => r.senderId || r.senderName)
  const hasRecipientData = requests.some(r => r.recipientId || r.recipientName || r.recipientEmail)

  const currentRecipientName = useMemo(() => {
    if (selectedRecipient === 'ALL') return null
    const req = requests.find(r => r.recipientId === selectedRecipient)
    return req?.recipientName || req?.recipientEmail || 'Recipient'
  }, [selectedRecipient, requests])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">🔍 Request & Email Logger</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Monitor and debug HTTP requests and email data in real-time</p>
        </div>

        <Navigation />

        {/* Active Filter Indicator */}
        {(selectedUser !== 'ALL' || selectedRecipient !== 'ALL') && (
          <div className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-xl p-5 mb-6 border-2 border-blue-300 dark:border-blue-700 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-base font-bold text-gray-900 dark:text-white">🎯 Active Filters:</span>
                {selectedUser !== 'ALL' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow-sm">
                    <span>👤 Sender:</span>
                    <span>{requests.find(r => r.senderId === selectedUser)?.senderName || 'User'}</span>
                  </div>
                )}
                {selectedRecipient !== 'ALL' && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold shadow-sm">
                    <span>📬 Recipient:</span>
                    <span>{currentRecipientName}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setSelectedUser('ALL'); setSelectedRecipient('ALL') }}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-2 border-blue-500 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
              >
                ✕ Clear All Filters
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
          {showUserStats && hasUserData && (
            <div className="lg:col-span-1">
              <UserStats requests={requests} selectedUser={selectedUser} onUserSelect={setSelectedUser} />
            </div>
          )}

          {showRecipientStats && hasRecipientData && (
            <div className="lg:col-span-1">
              <RecipientStats requests={requests} selectedRecipient={selectedRecipient} onRecipientSelect={setSelectedRecipient} />
            </div>
          )}

          <div className={`${(showUserStats && hasUserData) && (showRecipientStats && hasRecipientData) ? 'lg:col-span-4' : (showUserStats && hasUserData) || (showRecipientStats && hasRecipientData) ? 'lg:col-span-5' : 'lg:col-span-6'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">🔧 Filters & Controls</h3>
                <div className="flex gap-3">
                  {hasUserData && (
                    <button onClick={() => setShowUserStats(!showUserStats)} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold shadow-sm transition-colors">
                      {showUserStats ? '✕ Hide' : '👥 Show'} Senders
                    </button>
                  )}
                  {hasRecipientData && (
                    <button onClick={() => setShowRecipientStats(!showRecipientStats)} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold shadow-sm transition-colors">
                      {showRecipientStats ? '✕ Hide' : '📬 Show'} Recipients
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
                <input
                  type="text"
                  placeholder="🔍 Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white font-medium"
                />
                <select value={contentTypeFilter} onChange={(e) => setContentTypeFilter(e.target.value)} className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium">
                  <option value="ALL">All Types</option>
                  <option value="EMAIL">📨 Emails ({emailCount})</option>
                  <option value="API">🔌 API ({apiCount})</option>
                </select>
                <select value={emailTypeFilter} onChange={(e) => setEmailTypeFilter(e.target.value)} className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium" disabled={contentTypeFilter !== 'EMAIL' && contentTypeFilter !== 'ALL'}>
                  <option value="ALL">All Email Types</option>
                  {emailTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-medium">
                  <option value="ALL">All Methods</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <label className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">
                  <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Auto</span>
                </label>
              </div>

              <div className="flex gap-3 mb-5">
                <button onClick={fetchRequests} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md transition-colors">🔄 Refresh</button>
                <button onClick={clearRequests} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-md transition-colors">🗑️ Clear All</button>
              </div>

              <div className="pt-5 border-t-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-base font-medium flex-wrap gap-3">
                  <span className="text-gray-700 dark:text-gray-300">Total: <strong className="text-gray-900 dark:text-white text-xl">{requests.length}</strong></span>
                  <span className="text-gray-700 dark:text-gray-300">Filtered: <strong className="text-blue-600 dark:text-blue-400 text-xl">{filteredRequests.length}</strong></span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-5">📋 Requests ({filteredRequests.length})</h2>
                <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
                  {filteredRequests.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-xl text-gray-500 dark:text-gray-400">No requests logged yet</p>
                    </div>
                  ) : (
                    filteredRequests.map((req) => (
                      <div key={req.id} onClick={() => setSelectedRequest(req)} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg hover:shadow-xl cursor-pointer transition-all border-2 ${selectedRequest?.id === req.id ? 'border-blue-500 dark:border-blue-400' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {req.senderId && (
                              <div className={`w-10 h-10 rounded-full ${getUserColor(req.senderId)} flex items-center justify-center text-white font-bold shadow-md`}>{getInitials(req.senderName)}</div>
                            )}
                            {req.recipientId && (
                              <div className={`w-10 h-10 rounded-full ${getRecipientColor(req.recipientId)} flex items-center justify-center text-white font-bold shadow-md border-2 border-white dark:border-gray-800`}>{getInitials(req.recipientName)}</div>
                            )}
                            <span className={getMethodBadgeClass(req.method)}>{req.method}</span>
                          </div>
                          <div className="text-right bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                            <div className="text-base font-bold text-blue-700 dark:text-blue-300">{getRelativeTime(req.timestamp)}</div>
                            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{formatTimestamp(req.timestamp)}</div>
                          </div>
                        </div>
                        <div className="text-base font-bold text-gray-900 dark:text-white mb-2">{req.emailSubject || req.url}</div>
                        {(req.senderName || req.recipientName) && (
                          <div className="flex items-center gap-3 text-sm mb-2">
                            {req.senderName && <span className="text-gray-700 dark:text-gray-300">👤 <strong>From:</strong> {req.senderName}</span>}
                            {req.recipientName && <span className="text-purple-700 dark:text-purple-300">📬 <strong>For:</strong> {req.recipientName}</span>}
                          </div>
                        )}
                        {req.recipientEmail && (
                          <div className="mt-3"><span className="inline-block text-xs px-3 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 rounded-full font-semibold">📧 {req.recipientEmail}</span></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-5">📄 Details</h2>
                {selectedRequest ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="space-y-5">
                      <div className="pb-5 border-b-2 border-gray-200 dark:border-gray-700">
                        <div className="flex items-start justify-between">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Information</h3>
                          <div className="text-right bg-blue-100 dark:bg-blue-900/40 px-4 py-2 rounded-lg">
                            <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{getRelativeTime(selectedRequest.timestamp)}</div>
                            <div className="text-sm text-gray-700 dark:text-gray-400">{formatTimestamp(selectedRequest.timestamp)}</div>
                          </div>
                        </div>
                      </div>

                      {(selectedRequest.senderId || selectedRequest.recipientId) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pb-5 border-b-2 border-gray-200 dark:border-gray-700">
                          {selectedRequest.senderId && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                              <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-3">Sender</p>
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full ${getUserColor(selectedRequest.senderId)} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>{getInitials(selectedRequest.senderName)}</div>
                                <div>
                                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedRequest.senderName || 'Anonymous'}</p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{selectedRequest.senderId?.substring(0, 16)}...</p>
                                  {selectedRequest.deviceInfo && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{selectedRequest.deviceInfo}</p>}
                                </div>
                              </div>
                            </div>
                          )}
                          {selectedRequest.recipientId && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                              <p className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400 mb-3">Recipient</p>
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full ${getRecipientColor(selectedRequest.recipientId)} flex items-center justify-center text-white text-lg font-bold shadow-lg`}>{getInitials(selectedRequest.recipientName)}</div>
                                <div>
                                  <p className="text-base font-bold text-gray-900 dark:text-white">{selectedRequest.recipientName || 'Unknown'}</p>
                                  {selectedRequest.recipientEmail && <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">{selectedRequest.recipientEmail}</p>}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📊 Request Data</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2"><strong className="w-24">ID:</strong> <span className="text-gray-700 dark:text-gray-300">{selectedRequest.id}</span></div>
                          <div className="flex items-center gap-2"><strong className="w-24">Method:</strong> <span className={getMethodBadgeClass(selectedRequest.method)}>{selectedRequest.method}</span></div>
                          <div className="flex items-start gap-2"><strong className="w-24 flex-shrink-0">URL:</strong> <span className="text-gray-700 dark:text-gray-300 break-all">{selectedRequest.url}</span></div>
                          {selectedRequest.sessionId && <div className="flex items-center gap-2"><strong className="w-24">Session:</strong> <span className="text-gray-700 dark:text-gray-300">{selectedRequest.sessionId.substring(0, 24)}...</span></div>}
                        </div>
                      </div>

                      <div className="pt-5 border-t-2 border-gray-200 dark:border-gray-700">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">📦 Body</h4>
                        <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 max-h-96">{JSON.stringify(selectedRequest.body, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-16 text-center border border-gray-200 dark:border-gray-700">
                    <div className="text-6xl mb-4">👆</div>
                    <p className="text-xl text-gray-500 dark:text-gray-400">Select a request to view details</p>
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
