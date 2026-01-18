import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // For now, return a simple HTML page that represents the frame image
  // In production, you would generate actual images or use a different service
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dagda Gaming - Coinflip</title>
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
        .emoji { font-size: 60px; margin-bottom: 20px; }
        .title { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
        .subtitle { font-size: 32px; margin-bottom: 30px; }
        .description { font-size: 24px; opacity: 0.9; }
        .brand { font-size: 20px; margin-top: 20px; opacity: 0.8; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .brand-img { width: 24px; height: 24px; object-fit: contain; }
      </style>
    </head>
    <body>
      <div class="emoji">🪙</div>
      <div class="title">Coinflip Challenge</div>
      <div class="subtitle">Bet 5 PIE • Win 10 PIE</div>
      <div class="description">Choose heads or tails!</div>
      <div class="brand">
        <img src="${baseUrl}/games/dagda.png" alt="Dagda" class="brand-img" />
        Dagda Gaming
      </div>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
