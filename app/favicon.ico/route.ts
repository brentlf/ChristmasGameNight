import { NextResponse } from 'next/server'

export function GET(request: Request) {
  const url = new URL(request.url)
  url.pathname = '/icon.svg'
  url.search = ''
  return NextResponse.redirect(url, 307)
}

export function HEAD(request: Request) {
  return GET(request)
}
