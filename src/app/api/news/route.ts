import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sub = searchParams.get('sub') || 'FantasyFootball';
    const t = searchParams.get('t') || 'day';
    const limit = searchParams.get('limit') || '5';

    try {
        const response = await fetch(
            `https://www.reddit.com/r/${sub}/top.json?limit=${limit}&t=${t}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                next: { revalidate: 0 }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[News API] Reddit error ${response.status}:`, errorText);
            return NextResponse.json(
                { error: `Reddit returned ${response.status}`, details: errorText.substring(0, 100) },
                { status: response.status === 429 ? 429 : 500 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[News API] Fetch exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
