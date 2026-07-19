import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,
      variant: '53261999',
    },
    { status: 200 }
  );
}
