import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  console.log('OAuth callback received:', { code, state, error })

  if (error) {
    console.error('OAuth error:', error)
    // Return HTML that posts a message to the parent window
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'oauth_callback',
              success: false,
              error: '${error}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  if (!code) {
    console.error('No authorization code received')
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'oauth_callback',
              success: false,
              error: 'no_code'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  try {
    // In a real implementation, you would exchange the code for tokens
    // For now, we'll simulate success
    console.log('OAuth successful, sending message to parent window')

    return new NextResponse(`
      <html>
        <body>
          <h3>Authentication successful!</h3>
          <p>You can close this window.</p>
          <script>
            window.opener.postMessage({
              type: 'oauth_callback',
              success: true,
              code: '${code}'
            }, '*');
            // Close the window after a short delay
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({
              type: 'oauth_callback',
              success: false,
              error: 'callback_failed'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests if needed
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
