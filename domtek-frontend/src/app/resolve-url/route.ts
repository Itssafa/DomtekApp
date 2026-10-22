import { NextRequest, NextResponse } from 'next/server';

// Cette route ne vit pas sous /api : nginx envoie tout /api/* au backend Laravel.
// Elle ne suit que les liens Google Maps, pour ne pas servir de relais à n'importe quelle URL.
const HOTES_AUTORISES = ['maps.app.goo.gl', 'goo.gl', 'www.google.com', 'google.com', 'maps.google.com'];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'missing url' }, { status: 400 });

  let cible: URL;
  try {
    cible = new URL(url);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  if (cible.protocol !== 'https:' || !HOTES_AUTORISES.includes(cible.hostname)) {
    return NextResponse.json({ error: 'host not allowed' }, { status: 400 });
  }

  try {
    const res = await fetch(cible, { redirect: 'follow' });
    return NextResponse.json({ resolved: res.url });
  } catch {
    return NextResponse.json({ error: 'failed to resolve' }, { status: 500 });
  }
}
