# Sleeper Dynasty League Dashboard

A premium Next.js dashboard for your Sleeper Dynasty League. Built with high-performance aesthetics, real-time data fetching, and advanced analytics.

## Features

- **Dashboard**: Real-time standings, league stats, and manager info.
- **Trades**: historical trade tracking across the entire season.
- **Trade Analytics**: Visualization of team activity using Recharts.
- **League History**: Automatic walking back of league seasons via `previous_league_id` to identify past champions.
- **Bylaws**: Markdown-powered rulebook with a sleek UI.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment to Vercel

The easiest way to deploy this is using the [Vercel Platform](https://vercel.com/new).

1. Push this code to a GitHub repository.
2. Connect the repository to Vercel.
3. Vercel will automatically detect Next.js and deploy.

## Technical Details

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS 4.0 (Beta) with Typography plugin
- **Icons**: Lucide React
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Data Source**: Sleeper API
- **League ID**: `1203080446066307072`
