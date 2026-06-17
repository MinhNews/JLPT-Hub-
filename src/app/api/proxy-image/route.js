import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || blockedHosts.includes(hostname) || hostname.endsWith('.local')) {
      return NextResponse.json({ error: 'Unsupported image URL' }, { status: 400 });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image is too large' }, { status: 413 });
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image is too large' }, { status: 413 });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'URL does not point to an image' }, { status: 400 });
    }

    const base64String = Buffer.from(arrayBuffer).toString('base64');

    return NextResponse.json({
      mimeType: contentType,
      base64: base64String
    });
  } catch (error) {
    console.error('Error proxying image:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
