import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
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
