import { NextResponse } from 'next/server'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '107173471',
    },
    { status: 200 }
  )
}
