import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjM0ODA0OCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDM1OTA4MzYwMzk1OTgxRjE0MzIyOUJBMjkyMDk2M2U4MTc5MDg0OWEifQ",
      payload: "eyJkb21haW4iOiJkYWdkYS1wbGF5LnZlcmNlbC5hcHAifQ",
      signature: "7iJpSyCps/0YK556iVJHEfhDlXKzM4n/D42n/8HCGLcnyXo1OK8EG9To8IL3VlDqxMeZj2Xiw5YXF5c7eJ6YFRs="
    },
    frame: {
      version: "1",
      name: "Dagda Play",
      iconUrl: "https://dagda-play.vercel.app/icon.png",
      homeUrl: "https://dagda-play.vercel.app",
      imageUrl: "https://dagda-play.vercel.app/preview.png",
      splashImageUrl: "https://dagda-play.vercel.app/splash.png",
      splashBackgroundColor: "#ffffff",
    }
  };

  return NextResponse.json(manifest);
}
