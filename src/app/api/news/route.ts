import { NextResponse } from 'next/server';

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
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Reddit API responded with ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Reddit proxy error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
