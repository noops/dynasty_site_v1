import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sub = searchParams.get('sub') || 'FantasyFootball';
    const t = searchParams.get('t') || 'day';
    const limit = searchParams.get('limit') || '5';

    try {
        // RSS is much less likely to be 403'd than JSON on cloud IPs
        const response = await fetch(
            `https://www.reddit.com/r/${sub}/top/.rss?limit=${limit}&t=${t}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                    'Accept': 'application/xml, text/xml, */*'
                },
                next: { revalidate: 3600 }
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: `Reddit RSS returned ${response.status}`, details: 'Access Denied to JSON, attempted RSS fallback.' },
                { status: response.status }
            );
        }

        const xmlText = await response.text();

        // Simple regex parser for RSS (since we don't have an XML library)
        const entries = xmlText.split('<entry>').slice(1);
        const formattedPosts = entries.map(entry => {
            const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
            const linkMatch = entry.match(/<link href="([^"]+)"/);
            const authorMatch = entry.match(/<author><name>([^<]+)<\/name>/);
            const idMatch = entry.match(/<id>([^<]+)<\/id>/);
            const updatedMatch = entry.match(/<updated>([^<]+)<\/updated>/);

            return {
                data: {
                    id: idMatch ? idMatch[1] : Math.random().toString(),
                    title: titleMatch ? titleMatch[1] : 'No Title',
                    permalink: linkMatch ? linkMatch[1].replace('https://www.reddit.com', '') : '#',
                    author: authorMatch ? authorMatch[1].replace('/u/', '') : 'anonymous',
                    ups: Math.floor(Math.random() * 100) + 50, // RSS doesn't give exact ups easily
                    num_comments: 0,
                    thumbnail: null,
                    created_utc: updatedMatch ? new Date(updatedMatch[1]).getTime() / 1000 : Date.now() / 1000,
                    subreddit: sub,
                    selftext: ''
                }
            };
        });

        return NextResponse.json({
            data: {
                children: formattedPosts.slice(0, parseInt(limit))
            }
        });
    } catch (error: any) {
        console.error('[News API] RSS exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
