'use client'

import { useMemo } from 'react'

interface Request {
  senderId?: string
  senderName?: string
  sessionId?: string
  timestamp: string
}

interface UserStatsProps {
  requests: Request[]
  selectedUser: string
  onUserSelect: (userId: string) => void
}

export default function UserStats({ requests, selectedUser, onUserSelect }: UserStatsProps) {
  const userStats = useMemo(() => {
    const stats = new Map<string, {
      senderId: string
      senderName: string
      count: number
      sessions: Set<string>
      lastActive: Date
    }>()

    requests.forEach(req => {
      const id = req.senderId || 'anonymous'
      const name = req.senderName || 'Anonymous User'
      
      if (!stats.has(id)) {
        stats.set(id, {
          senderId: id,
          senderName: name,
          count: 0,
          sessions: new Set(),
          lastActive: new Date(req.timestamp)
        })
      }

      const userStat = stats.get(id)!
      userStat.count++
      if (req.sessionId) userStat.sessions.add(req.sessionId)
      
      const reqTime = new Date(req.timestamp)
      if (reqTime > userStat.lastActive) {
        userStat.lastActive = reqTime
      }
    })

    return Array.from(stats.values()).sort((a, b) => b.count - a.count)
  }, [requests])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getUserColor = (id: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ]
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const isActive = (lastActive: Date) => {
    const diff = Date.now() - lastActive.getTime()
    return diff < 300000 // Active within last 5 minutes
  }

  const totalRequests = requests.length
  const totalUsers = userStats.length
  const activeUsers = userStats.filter(u => isActive(u.lastActive)).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        👥 User Activity
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Users</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeUsers}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Active Now</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalRequests}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Requests</p>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* All Users Option */}
        <button
          onClick={() => onUserSelect('ALL')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
            selectedUser === 'ALL'
              ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            ALL
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 dark:text-white">All Users</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {totalRequests} requests
            </p>
          </div>
        </button>

        {/* Individual Users */}
        {userStats.map(user => (
          <button
            key={user.senderId}
            onClick={() => onUserSelect(user.senderId)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedUser === user.senderId
                ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
            }`}
          >
            <div className={`w-10 h-10 rounded-full ${getUserColor(user.senderId)} flex items-center justify-center text-white font-semibold relative`}>
              {getInitials(user.senderName)}
              {isActive(user.lastActive) && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-white">{user.senderName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {user.count} requests • {user.sessions.size} sessions
              </p>
            </div>
            {isActive(user.lastActive) && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                Active
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
