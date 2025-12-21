import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dagda-play.vercel.app';
  
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjM0ODA0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM1OTA4MzYwMzk1OTgxRjE0MzIyOUJBMjkyMDk2M2U4MTc5MDg0OWEifQ",
      payload: "eyJkb21haW4iOiJkYWdkYS1wbGF5LnZlcmNlbC5hcHAifQ",
      signature: "7iJpSyCps/0YK556iVJHEfhDlXKzM4n/D42n/8HCGLcnyXo1OK8EG9To8IL3VlDqxMeZj2Xiw5YXF5c7eJ6YFRs="
    },
    frame: {
      version: "1",
      name: "Dagda Play",
      iconUrl: `${baseUrl}/icon.svg`,
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/preview.svg`,
      splashImageUrl: `${baseUrl}/splash.svg`,
      splashBackgroundColor: "#10b981",
    }
  };

  return NextResponse.json(manifest);
}
