import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Land Rover Discovery 3 TDV6 XS — Keswick Green | For Sale',
  description:
    'Special-order Keswick Green Discovery 3 TDV6 XS. 6-speed manual, Factory Harman Kardon, heated seats, heated screen. Zero-advisory MOT. ~£17,800 documented service history from new. Auction coming soon.',
  openGraph: {
    title: 'Land Rover Discovery 3 TDV6 XS — Keswick Green',
    description:
      'A genuinely rare, fully documented Discovery 3. Special-order colour, rare manual gearbox, exceptional paper trail from day one. Auction preview.',
    images: [
      {
        url: 'https://fjanxghetbwi9mfv.public.blob.vercel-storage.com/car/exterior-front.jpg',
        width: 1200,
        height: 800,
        alt: 'Land Rover Discovery 3 in Keswick Green — front view',
      },
    ],
  },
}

export default function CarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
