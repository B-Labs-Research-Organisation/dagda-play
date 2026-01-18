import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dagda Gaming - Randomizer</title>
      <style>
        body {
          width: 600px;
          height: 400px;
          margin: 0;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
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
      <div class="emoji">🎲</div>
      <div class="title">Randomizer</div>
      <div class="subtitle">Wheel of Fortune</div>
      <div class="description">Win +10 or lose -10 PIE!</div>
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
