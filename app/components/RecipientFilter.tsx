'use client'

import { useMemo } from 'react'

interface Request {
  recipientId?: string
  recipientName?: string
  recipientEmail?: string
  timestamp: string
}

interface RecipientFilterProps {
  requests: Request[]
  selectedRecipient: string
  onRecipientSelect: (recipientId: string) => void
}

export default function RecipientFilter({ requests, selectedRecipient, onRecipientSelect }: RecipientFilterProps) {
  const recipientStats = useMemo(() => {
    const stats = new Map<string, {
      recipientId: string
      recipientName: string
      recipientEmail: string
      count: number
      lastReceived: Date
    }>()

    requests.forEach(req => {
      const id = req.recipientId || req.recipientEmail || 'no-recipient'
      const name = req.recipientName || req.recipientEmail || 'Unknown Recipient'
      const email = req.recipientEmail || 'No email'
      
      if (!stats.has(id)) {
        stats.set(id, {
          recipientId: id,
          recipientName: name,
          recipientEmail: email,
          count: 0,
          lastReceived: new Date(req.timestamp)
        })
      }

      const recipientStat = stats.get(id)!
      recipientStat.count++
      
      const reqTime = new Date(req.timestamp)
      if (reqTime > recipientStat.lastReceived) {
        recipientStat.lastReceived = reqTime
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

  const getRecipientColor = (id: string) => {
    const colors = [
      'bg-purple-500',
      'bg-pink-500',
      'bg-rose-500',
      'bg-fuchsia-500',
      'bg-violet-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-teal-500',
    ]
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const isRecent = (lastReceived: Date) => {
    const diff = Date.now() - lastReceived.getTime()
    return diff < 3600000 // Recent within last hour
  }

  const totalRequests = requests.length
  const totalRecipients = recipientStats.length
  const recentRecipients = recipientStats.filter(r => isRecent(r.lastReceived)).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📬 Recipients (For Whom)
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRecipients}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Recipients</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{recentRecipients}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Recent (1h)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalRequests}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total Items</p>
        </div>
      </div>

      {/* Recipient List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {/* All Recipients Option */}
        <button
          onClick={() => onRecipientSelect('ALL')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
            selectedRecipient === 'ALL'
              ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            ALL
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 dark:text-white">All Recipients</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {totalRequests} items
            </p>
          </div>
        </button>

        {/* Individual Recipients */}
        {recipientStats.map(recipient => (
          <button
            key={recipient.recipientId}
            onClick={() => onRecipientSelect(recipient.recipientId)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
              selectedRecipient === recipient.recipientId
                ? 'bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
            }`}
          >
            <div className={`w-10 h-10 rounded-full ${getRecipientColor(recipient.recipientId)} flex items-center justify-center text-white font-semibold relative`}>
              {getInitials(recipient.recipientName)}
              {isRecent(recipient.lastReceived) && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-purple-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 dark:text-white">{recipient.recipientName}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {recipient.count} items
              </p>
              {recipient.recipientEmail !== 'No email' && (
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                  {recipient.recipientEmail}
                </p>
              )}
            </div>
            {isRecent(recipient.lastReceived) && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full">
                Recent
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
