import { NextRequest, NextResponse } from 'next/server'

interface EmailData {
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  emailTo?: string[]
  emailType?: 'received' | 'sent' | 'draft' | string
}

interface ScraperData {
  source?: string // News outlet: NYT Cooking, The Atlantic, etc.
  scraperStatus?: 'success' | 'error' | 'pending' | string
  articleUrl?: string // Source URL
  scrapedAt?: string // Scraping timestamp
  contentType?: 'newsletter' | 'article' | 'digest' | 'alert' | string // Type of content
}

interface LoggedRequest {
  id: string
  method: string
  headers: Record<string, string>
  body: any
  timestamp: string
  ip: string
  url: string
  // Email-specific fields (optional for backward compatibility)
  emailSubject?: string
  emailBody?: string
  emailFrom?: string
  emailTo?: string[]
  emailType?: string
  isEmail?: boolean // Flag to identify email requests
  // Scraper-specific fields
  source?: string
  scraperStatus?: string
  articleUrl?: string
  scrapedAt?: string
  contentType?: string
  isScraper?: boolean // Flag to identify scraper requests
}

// In-memory storage (will be reset on server restart)
const requestLog: LoggedRequest[] = []

// Helper to generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper to get IP address
function getIpAddress(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

// Helper to convert Headers to plain object
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {}
  headers.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

// Helper to check if request contains email data
function isEmailRequest(body: any): boolean {
  return body && (
    body.emailSubject !== undefined ||
    body.emailBody !== undefined ||
    body.emailFrom !== undefined ||
    body.emailTo !== undefined ||
    body.emailType !== undefined
  )
}

// Helper to check if request contains scraper data
function isScraperRequest(body: any): boolean {
  return body && (
    body.source !== undefined ||
    body.scraperStatus !== undefined ||
    body.articleUrl !== undefined ||
    body.scrapedAt !== undefined ||
    body.contentType !== undefined
  )
}

// POST /api/log - Log a request
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

    // Extract email-specific fields if present
    if (isEmail && body) {
      loggedRequest.emailSubject = body.emailSubject
      loggedRequest.emailBody = body.emailBody
      loggedRequest.emailFrom = body.emailFrom
      loggedRequest.emailTo = body.emailTo
      loggedRequest.emailType = body.emailType || 'unknown'
    }

    // Extract scraper-specific fields if present
    if (isScraper && body) {
      loggedRequest.source = body.source
      loggedRequest.scraperStatus = body.scraperStatus || 'success'
      loggedRequest.articleUrl = body.articleUrl
      loggedRequest.scrapedAt = body.scrapedAt || new Date().toISOString()
      loggedRequest.contentType = body.contentType || 'article'
      
      // Also extract email fields if it's a scraped email
      if (isEmail) {
        loggedRequest.emailSubject = body.emailSubject
        loggedRequest.emailBody = body.emailBody
        loggedRequest.emailFrom = body.emailFrom
        loggedRequest.emailTo = body.emailTo
      }
    }

    requestLog.unshift(loggedRequest) // Add to beginning
    
    // Keep only last 200 requests to prevent memory issues (increased for scraper data)
    if (requestLog.length > 200) {
      requestLog.length = 200
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

// GET /api/log - Retrieve logged requests
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

  let filtered = [...requestLog]

  // Filter by method
  if (methodFilter) {
    filtered = filtered.filter(req => req.method === methodFilter.toUpperCase())
  }

  // Filter by email type
  if (emailTypeFilter) {
    filtered = filtered.filter(req => req.emailType === emailTypeFilter)
  }

  // Filter by email/non-email
  if (isEmailFilter !== null) {
    const isEmail = isEmailFilter === 'true'
    filtered = filtered.filter(req => !!req.isEmail === isEmail)
  }

  // Filter by scraper/non-scraper
  if (isScraperFilter !== null) {
    const isScraper = isScraperFilter === 'true'
    filtered = filtered.filter(req => !!req.isScraper === isScraper)
  }

  // Filter by source
  if (sourceFilter) {
    filtered = filtered.filter(req => req.source === sourceFilter)
  }

  // Filter by scraper status
  if (statusFilter) {
    filtered = filtered.filter(req => req.scraperStatus === statusFilter)
  }

  // Filter by content type
  if (contentTypeFilter) {
    filtered = filtered.filter(req => req.contentType === contentTypeFilter)
  }

  // Filter by search query
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

// DELETE /api/log - Clear all logged requests
export async function DELETE() {
  const count = requestLog.length
  requestLog.length = 0
  
  return NextResponse.json({
    success: true,
    cleared: count,
  })
}

// PUT /api/log - Also log PUT requests
export async function PUT(request: NextRequest) {
  return POST(request)
}

// PATCH /api/log - Also log PATCH requests
export async function PATCH(request: NextRequest) {
  return POST(request)
}
