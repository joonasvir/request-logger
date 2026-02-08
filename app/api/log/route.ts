import { NextRequest, NextResponse } from 'next/server'

interface EmailData {
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  emailTo?: string[]
  emailType?: 'received' | 'sent' | 'draft' | string
}

interface ScraperData {
  source?: string
  scraperStatus?: 'success' | 'error' | 'pending' | string
  articleUrl?: string
  scrapedAt?: string
  contentType?: 'newsletter' | 'article' | 'digest' | 'alert' | string
}

interface SenderData {
  senderName?: string
  senderId?: string
  sessionId?: string
  deviceInfo?: string
}

interface RecipientData {
  recipientName?: string
  recipientId?: string
  recipientEmail?: string
}

interface LoggedRequest {
  id: string
  method: string
  headers: Record<string, string>
  body: any
  timestamp: string
  ip: string
  url: string
  // Email-specific fields
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  emailTo?: string[]
  emailType?: string
  isEmail?: boolean
  // Scraper-specific fields
  source?: string
  scraperStatus?: string
  articleUrl?: string
  scrapedAt?: string
  contentType?: string
  isScraper?: boolean
  // Sender identification fields
  senderName?: string
  senderId?: string
  sessionId?: string
  deviceInfo?: string
  // Recipient identification fields
  recipientName?: string
  recipientId?: string
  recipientEmail?: string
}

// In-memory storage
const requestLog: LoggedRequest[] = []

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function getIpAddress(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {}
  headers.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

function isEmailRequest(body: any): boolean {
  return body && (
    body.emailSubject !== undefined ||
    body.emailBody !== undefined ||
    body.emailFrom !== undefined ||
    body.emailTo !== undefined ||
    body.emailType !== undefined
  )
}

function isScraperRequest(body: any): boolean {
  return body && (
    body.source !== undefined ||
    body.scraperStatus !== undefined ||
    body.articleUrl !== undefined ||
    body.scrapedAt !== undefined ||
    body.contentType !== undefined
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    
    const isEmail = isEmailRequest(body)
    const isScraper = isScraperRequest(body)
    
    const loggedRequest: LoggedRequest = {
      id: generateId(),
      method: request.method,
      headers: headersToObject(request.headers),
      body: body,
      timestamp: new Date().toISOString(),
      ip: getIpAddress(request),
      url: request.url,
      isEmail,
      isScraper,
    }

    // Extract email-specific fields
    if (isEmail && body) {
      loggedRequest.emailSubject = body.emailSubject
      loggedRequest.emailBody = body.emailBody
      loggedRequest.emailFrom = body.emailFrom
      loggedRequest.emailTo = body.emailTo
      loggedRequest.emailType = body.emailType || 'unknown'
    }

    // Extract scraper-specific fields
    if (isScraper && body) {
      loggedRequest.source = body.source
      loggedRequest.scraperStatus = body.scraperStatus || 'success'
      loggedRequest.articleUrl = body.articleUrl
      loggedRequest.scrapedAt = body.scrapedAt || new Date().toISOString()
      loggedRequest.contentType = body.contentType || 'article'
      
      if (isEmail) {
        loggedRequest.emailSubject = body.emailSubject
        loggedRequest.emailBody = body.emailBody
        loggedRequest.emailFrom = body.emailFrom
        loggedRequest.emailTo = body.emailTo
      }
    }

    // Extract sender identification fields
    if (body) {
      if (body.senderName) loggedRequest.senderName = body.senderName
      if (body.senderId) loggedRequest.senderId = body.senderId
      if (body.sessionId) loggedRequest.sessionId = body.sessionId
      if (body.deviceInfo) loggedRequest.deviceInfo = body.deviceInfo
      
      // Extract recipient identification fields
      if (body.recipientName) loggedRequest.recipientName = body.recipientName
      if (body.recipientId) loggedRequest.recipientId = body.recipientId
      if (body.recipientEmail) loggedRequest.recipientEmail = body.recipientEmail
    }

    requestLog.unshift(loggedRequest)
    
    if (requestLog.length > 300) {
      requestLog.length = 300
    }

    return NextResponse.json({
      success: true,
      id: loggedRequest.id,
      timestamp: loggedRequest.timestamp,
      isEmail: isEmail,
      isScraper: isScraper,
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to log request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const methodFilter = searchParams.get('method')
  const searchQuery = searchParams.get('search')
  const emailTypeFilter = searchParams.get('emailType')
  const isEmailFilter = searchParams.get('isEmail')
  const isScraperFilter = searchParams.get('isScraper')
  const sourceFilter = searchParams.get('source')
  const statusFilter = searchParams.get('status')
  const contentTypeFilter = searchParams.get('contentType')
  const senderIdFilter = searchParams.get('senderId')
  const sessionIdFilter = searchParams.get('sessionId')
  const senderNameFilter = searchParams.get('senderName')
  // Recipient filters
  const recipientIdFilter = searchParams.get('recipientId')
  const recipientNameFilter = searchParams.get('recipientName')
  const recipientEmailFilter = searchParams.get('recipientEmail')

  let filtered = [...requestLog]

  if (methodFilter) {
    filtered = filtered.filter(req => req.method === methodFilter.toUpperCase())
  }

  if (emailTypeFilter) {
    filtered = filtered.filter(req => req.emailType === emailTypeFilter)
  }

  if (isEmailFilter !== null) {
    const isEmail = isEmailFilter === 'true'
    filtered = filtered.filter(req => !!req.isEmail === isEmail)
  }

  if (isScraperFilter !== null) {
    const isScraper = isScraperFilter === 'true'
    filtered = filtered.filter(req => !!req.isScraper === isScraper)
  }

  if (sourceFilter) {
    filtered = filtered.filter(req => req.source === sourceFilter)
  }

  if (statusFilter) {
    filtered = filtered.filter(req => req.scraperStatus === statusFilter)
  }

  if (contentTypeFilter) {
    filtered = filtered.filter(req => req.contentType === contentTypeFilter)
  }

  if (senderIdFilter) {
    filtered = filtered.filter(req => req.senderId === senderIdFilter)
  }

  if (sessionIdFilter) {
    filtered = filtered.filter(req => req.sessionId === sessionIdFilter)
  }

  if (senderNameFilter) {
    const nameLower = senderNameFilter.toLowerCase()
    filtered = filtered.filter(req => 
      req.senderName?.toLowerCase().includes(nameLower)
    )
  }

  // Recipient filters
  if (recipientIdFilter) {
    filtered = filtered.filter(req => req.recipientId === recipientIdFilter)
  }

  if (recipientNameFilter) {
    const nameLower = recipientNameFilter.toLowerCase()
    filtered = filtered.filter(req => 
      req.recipientName?.toLowerCase().includes(nameLower)
    )
  }

  if (recipientEmailFilter) {
    filtered = filtered.filter(req => req.recipientEmail === recipientEmailFilter)
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(req => 
      JSON.stringify(req).toLowerCase().includes(query)
    )
  }

  return NextResponse.json({
    requests: filtered,
    total: filtered.length,
  })
}

export async function DELETE() {
  const count = requestLog.length
  requestLog.length = 0
  
  return NextResponse.json({
    success: true,
    cleared: count,
  })
}

export async function PUT(request: NextRequest) {
  return POST(request)
}

export async function PATCH(request: NextRequest) {
  return POST(request)
}
