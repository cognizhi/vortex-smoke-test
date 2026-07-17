import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    { ok: true, variant: '57235969' },
    { status: 200 }
  )
}
