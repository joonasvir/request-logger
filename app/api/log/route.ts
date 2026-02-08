import { NextRequest, NextResponse } from 'next/server'

interface LoggedRequest {
  id: string
  method: string
  headers: Record<string, string>
  body: any
  timestamp: string
  ip: string
  url: string
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

// POST /api/log - Log a request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null)
    
    const loggedRequest: LoggedRequest = {
      id: generateId(),
      method: request.method,
      headers: headersToObject(request.headers),
      body: body,
      timestamp: new Date().toISOString(),
      ip: getIpAddress(request),
      url: request.url,
    }

    requestLog.unshift(loggedRequest) // Add to beginning
    
    // Keep only last 100 requests to prevent memory issues
    if (requestLog.length > 100) {
      requestLog.length = 100
    }

    return NextResponse.json({
      success: true,
      id: loggedRequest.id,
      timestamp: loggedRequest.timestamp,
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

  let filtered = [...requestLog]

  // Filter by method
  if (methodFilter) {
    filtered = filtered.filter(req => req.method === methodFilter.toUpperCase())
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
