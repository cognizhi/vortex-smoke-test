import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '1012136249' },
    { status: 200 }
  )
}
