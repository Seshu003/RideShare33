import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');
    const radius = searchParams.get('radius') || '500';
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured' },
        { status: 403 }
      );
    }

    if (!input) {
      return NextResponse.json({ predictions: [] });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&types=(cities)&radius=${radius}&key=${apiKey}&components=country:in`
    );

    if (!response.ok) {
      console.error('Google Places API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch places from Google API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (data.status !== 'OK') {
      console.error('Google Places API response error:', data.status, data.error_message);
      return NextResponse.json(
        { error: data.error_message || 'Failed to fetch place suggestions' },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Places API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    );
  }
}