'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function FrameMeta() {
  const pathname = usePathname()

  useEffect(() => {
    // FrameMeta is currently disabled for Farcaster v2 support
    // v2 uses static manifest and layout-based metadata
  }, [pathname])

  return null
}

function updateFrameMeta({ image, buttons }: { image: string; buttons: Array<{ text: string; action: string; target: string }> }) {
  // Remove existing frame meta tags
  const existingFrameTags = document.querySelectorAll('meta[property^="fc:frame"]')
  existingFrameTags.forEach(tag => tag.remove())

  // Add new frame meta tags
  const head = document.head

  // Frame image
  const imageMeta = document.createElement('meta')
  imageMeta.setAttribute('property', 'fc:frame:image')
  imageMeta.setAttribute('content', image)
  head.appendChild(imageMeta)

  // Frame buttons
  buttons.forEach((button, index) => {
    const buttonIndex = index + 1

    const buttonTextMeta = document.createElement('meta')
    buttonTextMeta.setAttribute('property', `fc:frame:button:${buttonIndex}`)
    buttonTextMeta.setAttribute('content', button.text)
    head.appendChild(buttonTextMeta)

    const buttonActionMeta = document.createElement('meta')
    buttonActionMeta.setAttribute('property', `fc:frame:button:${buttonIndex}:action`)
    buttonActionMeta.setAttribute('content', button.action)
    head.appendChild(buttonActionMeta)

    const buttonTargetMeta = document.createElement('meta')
    buttonTargetMeta.setAttribute('property', `fc:frame:button:${buttonIndex}:target`)
    buttonTargetMeta.setAttribute('content', button.target)
    head.appendChild(buttonTargetMeta)
  })
}
