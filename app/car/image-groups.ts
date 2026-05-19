const B = 'https://fjanxghetbwi9mfv.public.blob.vercel-storage.com/car'

export type ImageItem = { src: string; alt: string }

export const exteriorImages: ImageItem[] = [
  { src: `${B}/exterior-front.jpg`, alt: 'Front view' },
  { src: `${B}/exterior-front-driver-quarter-1.jpg`, alt: 'Front driver quarter' },
  { src: `${B}/exterior-front-drivers-wing-and-bonnet.jpg`, alt: 'Driver wing and bonnet' },
  { src: `${B}/exterior-front-passenger-quarter-2.jpg`, alt: 'Front passenger quarter' },
  { src: `${B}/exterior-rear-driver-quarter-1.jpg`, alt: 'Rear driver quarter' },
  { src: `${B}/exterior-rear-driver-side-quarter.jpg`, alt: 'Rear driver side' },
  { src: `${B}/exterior-rear-passenger-quarter-1.jpg`, alt: 'Rear passenger quarter' },
  { src: `${B}/exterior-rear-bumper-and-tow-bar.jpg`, alt: 'Rear bumper and tow bar' },
]

export const engineImages: ImageItem[] = [
  { src: `${B}/engine-bay-1.jpg`, alt: 'Engine bay overview' },
  { src: `${B}/engine-bay-2.jpg`, alt: 'Engine bay detail' },
  { src: `${B}/engine-bay-colour-code-plate.jpg`, alt: 'Keswick Green LRC799/HFU factory colour plate' },
]

export const interiorImages: ImageItem[] = [
  { src: `${B}/interior-dashboard.jpg`, alt: 'Dashboard overview' },
  { src: `${B}/interior-dashboard-passenger.jpg`, alt: 'Dashboard — passenger side' },
  { src: `${B}/interior-dashboard-centre-controls.jpg`, alt: 'Centre controls — climate, audio, Terrain Response' },
  { src: `${B}/interior-center-console.jpg`, alt: 'Centre console' },
  { src: `${B}/interior-front-seat-driver.jpg`, alt: 'Driver seat' },
  { src: `${B}/interior-front-seat-passenger.jpg`, alt: 'Passenger seat' },
  { src: `${B}/interior-door-card-driver-front.jpg`, alt: 'Driver front door card — Harman Kardon tweeter' },
  { src: `${B}/interior-door-card-passenger-front.jpg`, alt: 'Passenger front door card' },
  { src: `${B}/interior-door-card-driver-rear.jpg`, alt: 'Driver rear door card' },
  { src: `${B}/interior-door-card-passenger-rear.jpg`, alt: 'Passenger rear door card' },
  { src: `${B}/interior-rear-of-front-seats.jpg`, alt: 'Rear of front seats' },
  { src: `${B}/interior-second-seat-row-1.jpg`, alt: 'Second row seats' },
  { src: `${B}/interior-second-seat-row-carpet.jpg`, alt: 'Second row carpet' },
  { src: `${B}/interior-third-rows-seats.jpg`, alt: 'Third row seats' },
  { src: `${B}/interior-rear-centre-console.jpg`, alt: 'Rear centre console' },
  { src: `${B}/interior-headlining.jpg`, alt: 'Headlining' },
  { src: `${B}/interior-boot-1.jpg`, alt: 'Boot space' },
  { src: `${B}/interior-boot-2.jpg`, alt: 'Boot — seats folded' },
]

export const wheelImages: ImageItem[] = [
  { src: `${B}/wheels-and-tyres-front-driver-1.jpg`, alt: 'Front driver — new tyre (May 2026)' },
  { src: `${B}/wheels-and-tyres-front-driver-2.jpg`, alt: 'Front driver — alloy close-up' },
  { src: `${B}/wheels-and-tyres-front-passenger-1.jpg`, alt: 'Front passenger — new tyre (May 2026)' },
  { src: `${B}/wheels-and-tyres-front-passenger-2.jpg`, alt: 'Front passenger — alloy close-up' },
  { src: `${B}/wheels-and-tyres-rear-driver-1.jpg`, alt: 'Rear driver tyre (Sep 2024)' },
  { src: `${B}/wheels-and-tyres-rear-driver-2.jpg`, alt: 'Rear driver — alloy close-up' },
  { src: `${B}/wheels-and-tyres-rear-passenger-1.jpg`, alt: 'Rear passenger tyre (Sep 2024)' },
  { src: `${B}/wheels-and-tyres-rear-passenger-2.jpg`, alt: 'Rear passenger — alloy close-up' },
]

export const undersideImages: ImageItem[] = [
  { src: `${B}/underside-front-sureface-corrosion.jpg`, alt: 'Underside front — surface corrosion' },
  { src: `${B}/underside-rear-sapre-wheel.jpg`, alt: 'Underside rear — spare wheel area' },
]

export const docsImages: ImageItem[] = [
  { src: `${B}/documentation-car-manuals-warenty-and-service-book.jpg`, alt: 'Handbooks, service portfolio and warranty docs in LR leather wallet' },
  { src: `${B}/documentation-invoices-servicing-repairs-and-mot.jpg`, alt: 'Complete invoice file — servicing, repairs and MOT' },
  { src: `${B}/two-keys.jpg`, alt: 'Two keys including receipted Land Rover blank' },
]

// Attention item images — keyed by the item title for inline placement
export const attentionImages: Record<string, ImageItem[]> = {
  'Centre console armrest': [
    { src: `${B}/interior-centre-console-arm-rest-damage.jpg`, alt: 'Centre armrest — delamination and tearing' },
  ],
  'Gear stick gaiter': [
    { src: `${B}/interior-gear-stick-gaitor-worn.jpg`, alt: 'Gear gaiter — cracked and worn' },
  ],
  'Headlining': [
    { src: `${B}/interior-headlining.jpg`, alt: 'Headlining — marks and small tears' },
  ],
  'Chassis and underside': [
    { src: `${B}/exterior-rear-sil-rust-driver.jpg`, alt: 'Rear sill rust — driver side' },
    { src: `${B}/exterior-rear-sil-rust-passenger.jpg`, alt: 'Rear sill rust — passenger side' },
    { src: `${B}/underside-front-sureface-corrosion.jpg`, alt: 'Underside front — surface corrosion' },
    { src: `${B}/underside-rear-sapre-wheel.jpg`, alt: 'Underside rear — spare wheel area' },
  ],
  'Window rubber trim': [
    { src: `${B}/exterior-drivers-door-window-rubber-bubbling.jpg`, alt: 'Window rubber trim — bubbling' },
  ],
}

// Flat array of ALL images for lightbox navigation
export const allImages: ImageItem[] = [
  ...exteriorImages,
  ...engineImages,
  ...interiorImages,
  ...wheelImages,
  ...undersideImages,
  ...docsImages,
  ...Object.values(attentionImages).flat(),
]
