'use client'

import { useEffect, useState } from 'react'
import Navigation from '../components/Navigation'
import UserStats from '../components/UserStats'

interface Article {
  id: string
  timestamp: string
  scrapedAt?: string
  source?: string
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  articleUrl?: string
  contentType?: string
  scraperStatus?: string
  senderName?: string
  senderId?: string
  sessionId?: string
  deviceInfo?: string
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sourceFilter, setSourceFilter] = useState('ALL')
  const [contentTypeFilter, setContentTypeFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState('ALL')
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showUserStats, setShowUserStats] = useState(false)

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams()
      params.append('isScraper', 'true')
      params.append('isEmail', 'true')
      if (selectedUser !== 'ALL') params.append('senderId', selectedUser)
      
      const res = await fetch(`/api/log?${params.toString()}`)
      const data = await res.json()
      setArticles(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [selectedUser])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchArticles, 5000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedUser])

  useEffect(() => {
    let filtered = articles

    if (sourceFilter !== 'ALL') {
      filtered = filtered.filter(article => article.source === sourceFilter)
    }

    if (contentTypeFilter !== 'ALL') {
      filtered = filtered.filter(article => article.contentType === contentTypeFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(article => {
        const searchLower = searchTerm.toLowerCase()
        return (
          article.source?.toLowerCase().includes(searchLower) ||
          article.emailSubject?.toLowerCase().includes(searchLower) ||
          article.emailBody?.toLowerCase().includes(searchLower) ||
          article.senderName?.toLowerCase().includes(searchLower)
        )
      })
    }

    setFilteredArticles(filtered)
  }, [articles, searchTerm, sourceFilter, contentTypeFilter])

  const toggleArticle = (id: string) => {
    const newExpanded = new Set(expandedArticles)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedArticles(newExpanded)
  }

  const getSourceBadge = (source?: string) => {
    if (!source) return { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200', icon: '📰' }
    
    const lower = source.toLowerCase()
    if (lower.includes('nyt') || lower.includes('times')) {
      return { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: '🗓️' }
    }
    if (lower.includes('atlantic')) {
      return { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: '🌊' }
    }
    if (lower.includes('post')) {
      return { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: '📬' }
    }
    if (lower.includes('guardian')) {
      return { color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', icon: '🛡️' }
    }
    if (lower.includes('cooking')) {
      return { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: '🍳' }
    }
    return { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '📰' }
  }

  const getContentTypeBadge = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'newsletter': return { text: 'Newsletter', color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
      case 'article': return { text: 'Article', color: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
      case 'digest': return { text: 'Digest', color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
      case 'alert': return { text: 'Alert', color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' }
      default: return { text: 'Content', color: 'bg-gray-50 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300' }
    }
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

  const sources = [...new Set(articles.filter(a => a.source).map(a => a.source))]
  const contentTypes = [...new Set(articles.filter(a => a.contentType).map(a => a.contentType))]
  const hasUserData = articles.some(a => a.senderId || a.senderName)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            📰 News & Articles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Scraped content from your favorite news sources and newsletters
          </p>
        </div>

        <Navigation />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className={`${showUserStats && hasUserData ? 'lg:col-span-1' : 'hidden lg:hidden'}`}>
            {hasUserData && (
              <UserStats
                requests={articles}
                selectedUser={selectedUser}
                onUserSelect={setSelectedUser}
              />
            )}
          </div>

          <div className={`${showUserStats && hasUserData ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedUser !== 'ALL' ? (
                    <span>Showing articles from: <strong className="text-gray-900 dark:text-white">
                      {articles.find(a => a.senderId === selectedUser)?.senderName || 'User'}
                    </strong></span>
                  ) : (
                    <span>Showing all articles</span>
                  )}
                </div>
                {hasUserData && (
                  <button
                    onClick={() => setShowUserStats(!showUserStats)}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50">
                    {showUserStats ? 'Hide' : 'Show'} Users
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{articles.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sources</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sources.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Filtered</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{filteredArticles.length}</p>
                  </div>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh (5s)</span>
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Search articles, headlines, content..."
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
                  value={contentTypeFilter}
                  onChange={(e) => setContentTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ALL">All Types</option>
                  {contentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="text-6xl mb-4">📨</div>
                <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">No articles yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Scraped news content will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredArticles.map((article) => {
                  const sourceBadge = getSourceBadge(article.source)
                  const contentTypeBadge = getContentTypeBadge(article.contentType)
                  const isExpanded = expandedArticles.has(article.id)
                  const preview = article.emailBody?.substring(0, 280) || ''
                  const hasMore = (article.emailBody?.length || 0) > 280

                  return (
                    <article
                      key={article.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100 dark:border-gray-700"
                    >
                      <div className="p-6 pb-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {article.senderId && (
                              <div className={`w-8 h-8 rounded-full ${getUserColor(article.senderId)} flex items-center justify-center text-white text-xs font-semibold`}>
                                {getInitials(article.senderName)}
                              </div>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${sourceBadge.color}`}>
                              <span>{sourceBadge.icon}</span>
                              <span>{article.source || 'Unknown Source'}</span>
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contentTypeBadge.color}`}>
                              {contentTypeBadge.text}
                            </span>
                          </div>
                          <time className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(article.scrapedAt || article.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </time>
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
                          {article.emailSubject || 'Untitled Article'}
                        </h2>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          {article.senderName && (
                            <span className="flex items-center gap-1">
                              <span>👤</span>
                              <span>{article.senderName}</span>
                            </span>
                          )}
                          {article.emailFrom && (
                            <span className="flex items-center gap-1">
                              <span>✍️</span>
                              <span>{article.emailFrom}</span>
                            </span>
                          )}
                          {article.articleUrl && (
                            <a
                              href={article.articleUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              <span>🔗</span>
                              <span>View source</span>
                            </a>
                          )}
                        </div>

                        {article.emailBody && (
                          <div className="prose dark:prose-invert prose-sm max-w-none">
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                              {isExpanded ? article.emailBody : preview}
                              {!isExpanded && hasMore && '...'}
                            </div>
                          </div>
                        )}
                      </div>

                      {hasMore && (
                        <div className="px-6 pb-6">
                          <button
                            onClick={() => toggleArticle(article.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>▲</span>
                                <span>Show less</span>
                              </>
                            ) : (
                              <>
                                <span>▼</span>
                                <span>Read more</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>Article ID: {article.id.substring(0, 8)}...</span>
                          {article.scraperStatus && (
                            <span className={`px-2 py-0.5 rounded ${
                              article.scraperStatus === 'success' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {article.scraperStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <span>💡</span>
                <span>How to Add Articles</span>
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Send scraped news content with user identification:
                </p>
                <pre className="block bg-blue-100 dark:bg-blue-900/40 p-4 rounded-lg text-xs overflow-x-auto">{
`curl -X POST http://localhost:3000/api/log \
  -H "Content-Type: application/json" \
  -d '{
  "source": "NYT Cooking",
  "contentType": "newsletter",
  "articleUrl": "https://cooking.nytimes.com/...",
  "scraperStatus": "success",
  "emailSubject": "5 Quick Pasta Recipes",
  "emailBody": "Your article content here...",
  "emailFrom": "cooking@nytimes.com",
  "senderName": "Joonas Virtanen",
  "senderId": "user-123",
  "sessionId": "session-abc",
  "deviceInfo": "Chrome/MacOS"
}'`
                }</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )

  function getInitials(name?: string): string {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  function getUserColor(id?: string): string {
    if (!id) return 'bg-gray-500'
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500']
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }
}
