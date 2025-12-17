import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    frame: {
      version: "1",
      name: "Dagda Play",
      iconUrl: "https://dagda-play.vercel.app/icon.png",
      homeUrl: "https://dagda-play.vercel.app",
      imageUrl: "https://dagda-play.vercel.app/preview.png",
      splashImageUrl: "https://dagda-play.vercel.app/splash.png",
      splashBackgroundColor: "#ffffff",
      buttonTitle: "Launch App"
    }
  };

  return NextResponse.json(manifest);
}
