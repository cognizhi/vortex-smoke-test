import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '661868846' },
    { status: 200 }
  )
}
