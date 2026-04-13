import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  try {
    // HEAD first (faster, no body download)
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    return NextResponse.json({ resolved: res.url });
  } catch {
    // Fallback to GET
    try {
      const res = await fetch(url, { redirect: 'follow' });
      return NextResponse.json({ resolved: res.url });
    } catch {
      return NextResponse.json({ error: 'failed to resolve' }, { status: 500 });
    }
  }
}
