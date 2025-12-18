import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dagda Gaming - Main Menu</title>
      <meta property="og:title" content="🏰 Dagda Gaming - Play & Earn!" />
      <meta property="og:description" content="Irish God of Games awaits! Play Coinflip & Randomizer with PIE tokens." />
      <meta property="og:image" content="${baseUrl}/api/frame/image" />
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${baseUrl}/api/frame/image" />
      <meta property="fc:frame:button:1" content="🎮 Play Coinflip" />
      <meta property="fc:frame:button:1:action" content="post" />
      <meta property="fc:frame:button:1:target" content="${baseUrl}/api/frame/coinflip" />
      <meta property="fc:frame:button:2" content="🎲 Play Randomizer" />
      <meta property="fc:frame:button:2:action" content="post" />
      <meta property="fc:frame:button:2:target" content="${baseUrl}/api/frame/randomizer" />
      <meta property="fc:frame:button:3" content="🏆 Leaderboard" />
      <meta property="fc:frame:button:3:action" content="post" />
      <meta property="fc:frame:button:3:target" content="${baseUrl}/api/frame/leaderboard" />
      <style>
        body {
          width: 600px;
          height: 400px;
          margin: 0;
          background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
          color: white;
          font-family: system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .emoji { font-size: 80px; margin-bottom: 20px; }
        .title { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
        .subtitle { font-size: 24px; opacity: 0.9; }
        .brand { font-size: 20px; margin-top: 30px; opacity: 0.8; }
      </style>
    </head>
    <body>
      <div class="emoji">🏰</div>
      <div class="title">Dagda Gaming</div>
      <div class="subtitle">Irish God of Games</div>
      <div class="brand">Choose your game!</div>
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
  return POST(new NextRequest('http://localhost:3000/api/frame'))
}
