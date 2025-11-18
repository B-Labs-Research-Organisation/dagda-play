import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Dagda Gaming - Main Menu</title>
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
