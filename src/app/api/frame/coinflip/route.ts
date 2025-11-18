import { NextRequest, NextResponse } from 'next/server'
import { FrameResponse } from '@/lib/frame-utils'

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return new NextResponse(
    FrameResponse({
      image: `${baseUrl}/api/frame/coinflip/image`,
      buttons: [
        {
          label: '🎮 Play Coinflip',
          action: 'post',
          target: `${baseUrl}/api/frame/coinflip/play`
        },
        {
          label: '🎲 Try Randomizer',
          action: 'post',
          target: `${baseUrl}/api/frame/randomizer`
        },
        {
          label: '🏠 Main Menu',
          action: 'post',
          target: `${baseUrl}/api/frame`
        }
      ],
      postUrl: `${baseUrl}/api/frame/coinflip/play`
    })
  )
}

export async function GET() {
  return POST(new NextRequest('http://localhost:3000/api/frame/coinflip'))
}
