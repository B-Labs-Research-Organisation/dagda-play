import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dagda Gaming - Leaderboard</title>
      <meta property="og:title" content="🏆 Dagda Gaming Leaderboard" />
      <meta property="og:description" content="See the top PIE earners! Compete for the highest balance." />
      <meta property="og:image" content="${baseUrl}/api/frame/leaderboard/image" />
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${baseUrl}/api/frame/leaderboard/image" />
      <meta property="fc:frame:button:1" content="🎮 Play Coinflip" />
      <meta property="fc:frame:button:1:action" content="post" />
      <meta property="fc:frame:button:1:target" content="${baseUrl}/api/frame/coinflip" />
      <meta property="fc:frame:button:2" content="🎲 Play Randomizer" />
      <meta property="fc:frame:button:2:action" content="post" />
      <meta property="fc:frame:button:2:target" content="${baseUrl}/api/frame/randomizer" />
      <meta property="fc:frame:button:3" content="🏠 Main Menu" />
      <meta property="fc:frame:button:3:action" content="post" />
      <meta property="fc:frame:button:3:target" content="${baseUrl}/api/frame" />
      <style>
        body {
          width: 600px;
          height: 400px;
          margin: 0;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%);
          color: white;
          font-family: system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .emoji { font-size: 60px; margin-bottom: 20px; }
        .title { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
        .subtitle { font-size: 32px; margin-bottom: 30px; }
        .description { font-size: 24px; opacity: 0.9; }
        .brand { font-size: 20px; margin-top: 20px; opacity: 0.8; }
      </style>
    </head>
    <body>
      <div class="emoji">🏆</div>
      <div class="title">Leaderboard</div>
      <div class="subtitle">Top PIE Earners</div>
      <div class="description">Compete for glory!</div>
      <div class="brand">🏰 Dagda Gaming</div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/frame/leaderboard'))
}
