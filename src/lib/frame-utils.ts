export interface FrameButton {
  label: string
  action: 'post' | 'link'
  target: string
}

export interface FrameResponseData {
  image: string
  buttons: FrameButton[]
  postUrl?: string
  inputText?: string
}

export function FrameResponse(data: FrameResponseData): string {
  const { image, buttons, postUrl, inputText } = data

  let frameHtml = `<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="🏰 Dagda Gaming - Play & Earn!" />
  <meta property="og:description" content="Irish God of Games awaits! Play Coinflip & Randomizer with PIE tokens." />
  <meta property="og:image" content="${image}" />
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${image}" />`

  buttons.forEach((button, index) => {
    const buttonIndex = index + 1
    frameHtml += `
  <meta property="fc:frame:button:${buttonIndex}" content="${button.label}" />
  <meta property="fc:frame:button:${buttonIndex}:action" content="${button.action}" />
  <meta property="fc:frame:button:${buttonIndex}:target" content="${button.target}" />`
  })

  if (postUrl) {
    frameHtml += `
  <meta property="fc:frame:post_url" content="${postUrl}" />`
  }

  if (inputText) {
    frameHtml += `
  <meta property="fc:frame:input:text" content="${inputText}" />`
  }

  frameHtml += `
</head>
<body>
  <div>This page is a Farcaster Frame for Dagda Gaming</div>
</body>
</html>`

  return frameHtml
}
