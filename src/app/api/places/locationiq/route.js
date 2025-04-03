export const runtime = 'edge';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get('input');

    if (!input) {
      return Response.json(
        { error: 'Search input is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.LOCATIONIQ_API_KEY;
    const response = await fetch(
      `https://api.locationiq.com/v1/autocomplete?key=${apiKey}&q=${encodeURIComponent(input)}&limit=5&dedupe=1`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('LocationIQ API error:', response.status, response.statusText);
      return Response.json(
        { error: 'Failed to fetch places from LocationIQ API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform LocationIQ response to match the existing format
    const suggestions = data.map(place => ({
      place_id: place.place_id,
      description: place.display_name,
      structured_formatting: {
        main_text: place.display_name,
        secondary_text: place.address?.state || ''
      }
    }));

    return Response.json({ predictions: suggestions });
  } catch (error) {
    console.error('LocationIQ API error:', error);
    return Response.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    );
  }
}
