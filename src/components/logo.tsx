// src\components\logo.tsx

import Image from "next/image"
import Link from "next/link"

// Using cloud storage logo asset
// const defaultLogo = 'https://storage.googleapis.com/markitbot-global-assets/Bakedbot_2024_vertical_logo-PNG%20transparent.png';
const defaultLogo = '/images/highroad-thailand/markitbot-ai.png';

type Props = {
  height?: number
  priority?: boolean
  className?: string
}

export default function Logo({ height = 40, priority = true, className }: Props) {
  const width = Math.round(height * 2.5); // Adjust ratio

  return (
    <Link href="/" aria-label="markitbot AI - Home" className={`flex items-center gap-1.5 ${className || ''}`}>
      <Image
        src={defaultLogo}
        alt="MarkitBot AI"
        width={width}
        height={height}
        priority={priority}
        sizes={`${width}px`}
      />
    </Link>
  )
}
