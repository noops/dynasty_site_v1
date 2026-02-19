import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sub = searchParams.get('sub') || 'FantasyFootball';
    const t = searchParams.get('t') || 'day';
    const limit = searchParams.get('limit') || '5';

    try {
        // Using old.reddit.com and mobile headers often bypasses strict cloud blocks
        const response = await fetch(
            `https://old.reddit.com/r/${sub}/top.json?limit=${limit}&t=${t}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://www.google.com/',
                    'Origin': 'https://www.reddit.com',
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
