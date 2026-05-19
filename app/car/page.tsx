/* eslint-disable react/no-unescaped-entities */
// Faithful replica of the eBay listing HTML — restructured to match the draft exactly.
// Enhanced with photo galleries, lightbox, embedded video, and auction banner.

import Image from 'next/image'
import CarGallery from './CarGallery'
import {
  exteriorImages,
  engineImages,
  wheelImages,
  allImages,
  interiorDashboardRow,
  interiorSeatsRow,
  interiorMidRow,
  interiorBackRow,
  interiorDoorCardsRow,
} from './image-groups'

const B = 'https://fjanxghetbwi9mfv.public.blob.vercel-storage.com/car'

const captionStyle = { fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', textAlign: 'center' as const, marginTop: 6 }

export default function CarPage() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: "Georgia,'Times New Roman',serif", color: '#1a1a1a', background: '#fff', padding: '0 16px' }}>

      {/* ===== AUCTION BANNER ===== */}
      <div style={{ background: '#1a1a1a', padding: '12px 32px', borderRadius: '8px 8px 0 0', marginBottom: 0, textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' as const }}>
        <span style={{ background: '#f2c200', color: '#111', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 4, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>AUCTION PREVIEW</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13 }}>This car is coming soon to eBay — watch, save, get ready to bid.</span>
      </div>

      {/* ===== HERO IMAGE ===== */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
        <Image
          src={`${B}/exterior-front-passenger-quarter-2.jpg`}
          alt="Land Rover Discovery 3 TDV6 XS Keswick Green"
          fill
          sizes="780px"
          priority
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* ===== HERO TEXT ===== */}
      <div style={{ background: '#253328', padding: '32px 32px 28px', marginBottom: 4 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#7aaa82', marginBottom: 14 }}>
          BP07PMO &nbsp;·&nbsp; First registered 31 July 2007 &nbsp;·&nbsp; 172,873 miles
        </div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#ffffff', lineHeight: 1.15, marginBottom: 8 }}>
          Land Rover Discovery 3<br />TDV6 XS — Keswick Green
        </div>
        <div style={{ fontSize: 15, color: '#92bea0', marginBottom: 24, fontFamily: 'Arial,Helvetica,sans-serif', fontWeight: 300 }}>
          2.7 litre TDV6 diesel &nbsp;·&nbsp; 6-speed manual ZF &nbsp;·&nbsp; Full-time 4WD &nbsp;·&nbsp; 7 seats &nbsp;·&nbsp; Zero-advisory MOT to October 2026
        </div>
        {/* Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
          {['Special-order colour', 'Factory Harman Kardon', 'Factory heated seats', 'Factory heated screen', '~£17,800 documented spend', '4th keeper', 'Full invoice history', '6-speed manual — rare'].map(pill => (
            <span key={pill} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: '#c8e0ca', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 12, padding: '5px 13px', borderRadius: 20 }}>{pill}</span>
          ))}
        </div>
      </div>

      {/* Registration plate bar */}
      <div style={{ background: '#1a2620', padding: '14px 32px', borderRadius: '0 0 8px 8px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>
        <div style={{ background: '#f2c200', color: '#111', fontFamily: "'Courier New',Courier,monospace", fontSize: 22, fontWeight: 700, padding: '5px 18px', borderRadius: 5, letterSpacing: '0.1em', border: '2px solid #c9a000' }}>BP07 PMO</div>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#6a9272' }}>VIN: SALLAAA178A451416 &nbsp;·&nbsp; Engine: 0240857276DT &nbsp;·&nbsp; V5C: CT 5431033</div>
      </div>

      {/* ===== EXTERIOR GALLERY ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 12 }}>Exterior — click any image to view full size</div>
        <CarGallery images={exteriorImages.slice(0, 4)} allImages={allImages} columns={4} compact />
        <CarGallery images={exteriorImages.slice(4)} allImages={allImages} columns={4} compact />
        <div style={captionStyle}>Front &nbsp;·&nbsp; Front driver quarter &nbsp;·&nbsp; Front passenger quarter &nbsp;·&nbsp; Driver wing &amp; bonnet &nbsp;·&nbsp; Rear driver quarter &nbsp;·&nbsp; Rear driver side &nbsp;·&nbsp; Rear passenger quarter &nbsp;·&nbsp; Rear bumper &amp; tow bar</div>
      </div>

      {/* ===== VIDEO CTA ===== */}
      <div style={{ background: '#1c2b1e', borderRadius: 8, padding: '28px 28px 24px', marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#5a8c5e', marginBottom: 10 }}>&#9654; Watch before you bid</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 10 }}>18-minute full walkround video on YouTube</div>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 14, color: '#92bea0', lineHeight: 1.7, marginBottom: 20 }}>
          Every area of the car shown honestly, including a cold start, engine running, all electrics demonstrated, Terrain Response and air suspension across all settings, a drive up the street — and the rear parking sensor fault clearly audible. Watch this first; it will answer most of your questions.
        </div>
        {/* Embedded YouTube video */}
        <iframe
          src="https://www.youtube.com/embed/wbIp_eK1aIE?rel=0"
          style={{ width: '100%', aspectRatio: '16/9', borderRadius: 6, border: 'none', marginBottom: 20 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
        {/* Timecode grid */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18 }}>
          <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#4a7a50', marginBottom: 14 }}>Jump to a specific section</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
            {[
              { t: 0, code: '00:00', label: 'Exterior overview' },
              { t: 58, code: '00:58', label: 'Spare wheel' },
              { t: 80, code: '01:20', label: 'Passenger side & wheels' },
              { t: 103, code: '01:43', label: 'Passenger interior' },
              { t: 120, code: '02:00', label: 'Console, gaiter & armrest' },
              { t: 164, code: '02:44', label: 'Headlining' },
              { t: 412, code: '06:52', label: 'Armrest damage close-up' },
              { t: 440, code: '07:20', label: 'Under bonnet / engine bay' },
              { t: 470, code: '07:50', label: 'Keswick Green colour label' },
              { t: 510, code: '08:30', label: 'Cold start' },
              { t: 572, code: '09:32', label: 'Dash, dials & mileage' },
              { t: 631, code: '10:31', label: 'Harman Kardon audio demo' },
              { t: 640, code: '10:40', label: 'Air suspension & Terrain Response' },
              { t: 706, code: '11:46', label: 'Underside — front & sides' },
              { t: 776, code: '12:56', label: 'Each wheel & brake discs' },
              { t: 856, code: '14:16', label: 'Drive up the street' },
              { t: 888, code: '14:48', label: '\u26A0 Parking sensor fault audible', bold: true },
              { t: 980, code: '16:20', label: 'Lights on walk around' },
              { t: 1010, code: '16:50', label: 'Windows & mirrors demo' },
            ].map(({ t, code, label, bold }) => (
              <a key={t} href={`https://www.youtube.com/watch?v=wbIp_eK1aIE&t=${t}s`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '8px 10px', textDecoration: 'none' }}>
                <span style={{ fontFamily: "'Courier New',Courier,monospace", fontSize: 11, color: '#5a9e62', display: 'block' }}>{code}</span>
                <span style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 12, color: '#b8d4ba', fontWeight: bold ? 700 : 400 }}>{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ===== THE VEHICLE ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>The vehicle</div>
        <p style={{ fontSize: 16, lineHeight: 1.8, margin: '0 0 14px', color: '#1a1a1a' }}>
          This is a <strong>genuinely rare and thoroughly documented Discovery 3</strong> — a special-order Keswick Green example that stands apart from the sea of Bonatti Grey and Zermatt Silver cars on the market. Keswick Green was a Defender colour, available on the D3 by special order only. You simply do not see them.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8, margin: '0 0 14px', color: '#1a1a1a' }}>
          Paired with a <strong>6-speed manual ZF gearbox</strong> — fitted to only a small fraction of Discovery 3s, the vast majority of which were automatic — this car draws a second look wherever it goes.
        </p>
        {/* Callout */}
        <div style={{ background: '#f6f9f6', borderLeft: '4px solid #2a6e38', borderRadius: '0 6px 6px 0', padding: '16px 20px', margin: '20px 0', fontStyle: 'italic', fontSize: 15, lineHeight: 1.75, color: '#2a2a2a' }}>
          Bought new by a Land Rover company fleet operation in 2007 and maintained throughout its life exclusively by Land Rover franchised dealers and dedicated Land Rover specialists — from Gateshead to Huddersfield to Inverness to Bromsgrove. The paper trail is exceptional.
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.8, margin: 0, color: '#1a1a1a' }}>
          The car has covered approximately <strong>172,873 miles over 18 years</strong> — around 9,600 a year — used as a daily driver under the current owner covering significant motorway mileage. The engine returns <strong>31MPG real-world</strong> on regular runs (on-board computer reads 33MPG). Terrain Response, air suspension and all four-wheel-drive systems work correctly across all settings.
        </p>
      </div>

      {/* ===== MOT STATUS ===== */}
      <div style={{ background: '#edf7ee', border: '1px solid #a8d8aa', borderRadius: 8, padding: '18px 22px', marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, fontWeight: 700, color: '#1a5c22', marginBottom: 6 }}>&#10003;&nbsp; MOT PASS — ZERO ADVISORIES — Valid to 26 October 2026</div>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#2e7a38', lineHeight: 1.6 }}>
          Test number 6157 0190 4784 &nbsp;·&nbsp; Wildmoor Truck and Plant Ltd, Bromsgrove &nbsp;·&nbsp; 163,030 miles &nbsp;·&nbsp; 27 October 2025<br />
          The October 2025 test returned the cleanest possible result following a complete programme of rectification and renewal in 2024–25. Every MOT failure in this car's history was repaired promptly and the car returned to pass.
        </div>
      </div>

      {/* ===== FACTORY SPEC GRID ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Factory specification</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <tbody>
            {[
              [{ l: 'Engine', v: '2.7 litre TDV6 diesel — 190bhp / 140kW', bg: true }, { l: 'Gearbox', v: '6-speed manual ZF — rare fitment', bg: true }],
              [{ l: 'Colour', v: 'Keswick Green — LRC799/HFU — special order only' }, { l: 'Drivetrain', v: 'Full-time 4WD with Terrain Response' }],
              [{ l: 'Audio — factory option', v: 'Harman Kardon Hi-ICE — 8 speakers, subwoofer, fibre optic amp, 6-CD changer', bg: true }, { l: 'Seats', v: '7 seats — full three-row configuration', bg: true }],
              [{ l: 'Heated seats — factory option', v: 'Both front seats — not standard on XS trim' }, { l: 'Heated windscreen — factory option', v: 'Full screen — not standard on XS trim' }],
              [{ l: 'Towing', v: '3,500kg braked — tow bar fitted', bg: true }, { l: 'Air suspension', v: 'New OEM AMK pump + OEM JLR tank — July 2024', bg: true }],
              [{ l: 'Navigation', v: 'Factory TFT sat nav — dashboard mounted' }, { l: 'Wheels', v: '18-inch anthracite alloys — original fitment' }],
            ].map((row, i) => (
              <tr key={i}>
                {row.map(({ l, v, bg }: { l: string; v: string; bg?: boolean }) => (
                  <td key={l} style={{ width: '50%', padding: '8px 10px', verticalAlign: 'top', border: '1px solid #e8e8e8', background: bg ? '#fafafa' : undefined }}>
                    <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#999', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{v}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Engine bay photo gallery */}
        <CarGallery images={engineImages} allImages={allImages} columns={3} />
        <div style={captionStyle}>Engine bay &nbsp;·&nbsp; Engine bay detail &nbsp;·&nbsp; Factory Keswick Green colour plate LRC799/HFU — click to enlarge</div>
      </div>

      {/* ===== WHY THIS ONE ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Why this one</div>

        {/* Zero-advisory MOT */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a' }}>
            <strong>Zero-advisory MOT to October 2026.</strong> The October 2025 test at 163,030 miles returned the cleanest possible result. This followed new front calipers, discs and pads, new ARB drop link, seatbelt replacements, and all advisory items from prior tests fully resolved.
          </div>
        </div>

        {/* Exceptional paper trail */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a' }}>
            <strong>Exceptional paper trail.</strong> 8 service stamps from 6 Land Rover dealers commencing at 5 miles from new, backed by a continuous file of original invoices from 2012 onwards. Every item cross-references the correct VIN. Approximately £17,800 of combined documented expenditure.
          </div>
        </div>

        {/* Manual gearbox */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a' }}>
            <strong>6-speed manual gearbox — the rare one.</strong> Full clutch kit replacement January 2016 at Land Rover Centre Huddersfield: clutch plate, cover, bearing, flywheel, concentric slave cylinder. Changes cleanly with no issues.
          </div>
        </div>

        {/* Keswick Green */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a' }}>
            <strong>Special-order Keswick Green — genuinely rare on a D3.</strong> The factory colour label is confirmed in the engine bay. Already sought after by enthusiasts; this is not a colour you stumble across.
          </div>
        </div>

        {/* Harman Kardon — with inline image */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a', width: '100%' }}>
            <strong>Factory Harman Kardon Hi-ICE — fully operational.</strong> Normally only on SE and HSE trim levels. All 8 speakers, passive subwoofer, fibre optic amplifier, in-dash 6-CD changer and steering wheel controls all working. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=631s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a' }}>Hear it at 10:31 on the video.</a>
            <div style={{ marginTop: 10 }}>
              <a href={`${B}/interior-door-card-driver-front.jpg`} target="_blank" rel="noopener noreferrer">
                <Image src={`${B}/interior-door-card-driver-front.jpg`} alt="Harman Kardon tweeter grille on driver front door card" width={340} height={255} style={{ display: 'block', borderRadius: 4, width: '100%', maxWidth: 340, height: 'auto' }} />
              </a>
              <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', marginTop: 4 }}>Harman Kardon tweeter grille on driver front door card — click to enlarge</div>
            </div>
          </div>
        </div>

        {/* Document wallet — with inline images */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a', width: '100%' }}>
            <strong>Complete original document wallet.</strong> Owner's Handbook, Quick Start Guide, Navigation Handbook, Assistance Handbook, Extended Warranty book, original stamped Service Portfolio, V5C and current MOT certificate — all in the original Land Rover leather wallet.
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
              <a href={`${B}/documentation-car-manuals-warenty-and-service-book.jpg`} target="_blank" rel="noopener noreferrer">
                <Image src={`${B}/documentation-car-manuals-warenty-and-service-book.jpg`} alt="Handbooks and service book in LR leather wallet" width={340} height={255} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
              </a>
              <a href={`${B}/documentation-invoices-servicing-repairs-and-mot.jpg`} target="_blank" rel="noopener noreferrer">
                <Image src={`${B}/documentation-invoices-servicing-repairs-and-mot.jpg`} alt="Complete invoice file" width={340} height={255} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
              </a>
            </div>
            <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', marginTop: 4 }}>Handbooks &amp; service book in LR wallet &nbsp;·&nbsp; The complete invoice file — click to enlarge</div>
          </div>
        </div>

        {/* Two keys — with inline image */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
          <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a', width: '100%' }}>
            <strong>Two keys.</strong> Including one genuine Land Rover key blank purchased from Land Rover Centre Huddersfield in May 2013 (receipted at £159.36).
            <div style={{ marginTop: 10 }}>
              <a href={`${B}/two-keys.jpg`} target="_blank" rel="noopener noreferrer">
                <Image src={`${B}/two-keys.jpg`} alt="Two keys" width={300} height={225} style={{ display: 'block', borderRadius: 4, width: '100%', maxWidth: 300, height: 'auto' }} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ===== INTERIOR ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 12 }}>Interior — click any image to view full size</div>
        {/* Dashboard row — 3 col */}
        <CarGallery images={interiorDashboardRow} allImages={allImages} columns={3} compact />
        <div style={{ ...captionStyle, marginBottom: 6 }}>Dashboard &nbsp;·&nbsp; Passenger side &nbsp;·&nbsp; Centre controls (climate, audio, Terrain Response)</div>
        {/* Seats and console — 3 col */}
        <CarGallery images={interiorSeatsRow} allImages={allImages} columns={3} compact />
        <div style={{ ...captionStyle, marginBottom: 6 }}>Driver seat &nbsp;·&nbsp; Passenger seat &nbsp;·&nbsp; Centre console</div>
        {/* Rear of front seats + second row — 3 col */}
        <CarGallery images={interiorMidRow} allImages={allImages} columns={3} compact />
        <div style={{ ...captionStyle, marginBottom: 6 }}>Rear of front seats &nbsp;·&nbsp; Second row &nbsp;·&nbsp; Second row carpet</div>
        {/* Third row, rear console, boot — 4 col */}
        <CarGallery images={interiorBackRow} allImages={allImages} columns={4} compact />
        <div style={{ ...captionStyle, marginBottom: 6 }}>Third row seats &nbsp;·&nbsp; Rear centre console &nbsp;·&nbsp; Boot (&times;2)</div>
        {/* Door cards — 4 col */}
        <CarGallery images={interiorDoorCardsRow} allImages={allImages} columns={4} compact />
        <div style={captionStyle}>Door cards — driver front (HK tweeter visible) &nbsp;·&nbsp; Passenger front &nbsp;·&nbsp; Driver rear &nbsp;·&nbsp; Passenger rear</div>
      </div>

      {/* ===== WHEELS & TYRES ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 12 }}>Wheels &amp; tyres — all four corners</div>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#444', marginBottom: 10, lineHeight: 1.6 }}>
          All four tyres are Continental CrossContact 255/60R18. <strong>Front pair new May 2026.</strong> Rear pair fitted September 2024, moderate wear. All alloys are the original 18-inch anthracite fitment — paint peeling on all four, declared in the condition section below.
        </div>
        <CarGallery images={wheelImages.slice(0, 4)} allImages={allImages} columns={4} compact />
        <div style={{ ...captionStyle, marginBottom: 6 }}>Front driver (new May 2026) &nbsp;·&nbsp; Front driver alloy &nbsp;·&nbsp; Front passenger (new May 2026) &nbsp;·&nbsp; Front passenger alloy</div>
        <CarGallery images={wheelImages.slice(4)} allImages={allImages} columns={4} compact />
        <div style={captionStyle}>Rear driver (Sep 2024, moderate wear) &nbsp;·&nbsp; Rear driver alloy &nbsp;·&nbsp; Rear passenger (Sep 2024) &nbsp;·&nbsp; Rear passenger alloy</div>
      </div>

      {/* ===== SERVICE HISTORY TIMELINE ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 8 }}>Service &amp; repair history — year by year with invoice count</div>
        <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#666', margin: '0 0 16px', lineHeight: 1.6 }}>Every invoice and receipt listed below is an original document, present and available for inspection. All cross-reference VIN SALLAAA178A451416. Combined documented expenditure approximately <strong style={{ color: '#1a1a1a' }}>£17,800</strong>.</p>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              { year: '2007', docs: '1 document', text: 'Supplied new at 5 miles by Land Rover Company Vehicles, Rugby. Supplying dealer signed off in service book. New vehicle delivery — factory fresh.', current: true, alt: true },
              { year: '2008', docs: '1 invoice', text: 'A-service at Silverstone Land Rover, Durham — 12,841 miles. Oil service, brake fluid, coolant change, anti-corrosion inspection. Service book stamped.' },
              { year: '2009', docs: '1 invoice', text: 'B-service at Team Valley Land Rover, Gateshead — 24,568 miles. Oil service, brake fluid, coolant change, anti-corrosion inspection. Service book stamped.', alt: true },
              { year: '2010', docs: '1 invoice', text: 'A-service at Team Valley Land Rover, Gateshead — 35,247 miles. Oil service, brake fluid, coolant, anti-corrosion inspection. Service book stamped. First MOT July 2010 — PASS, no advisories.' },
              { year: '2011', docs: '1 invoice', text: 'A-service at Team Valley Land Rover, Gateshead — 44,945 miles. Oil service, anti-corrosion inspection. Service book stamped. MOT July 2011 — PASS, no advisories.', alt: true },
              { year: '2012', docs: '3 invoices', text: null, jsx: <>Service at Armstrong Massey LR, York — 47,747 miles (<strong>£437.36</strong>). Bush bar fitted at LR Centre Huddersfield (<strong>£116.40</strong>). Rear brake discs and pads — genuine LR parts, 53,661 miles (<strong>£334.56</strong>). MOT February 2012 — PASS.</> },
              { year: '2013', docs: '4 invoices / receipts', text: null, jsx: <>Parts and service at Armstrong Massey LR (<strong>£437.36</strong>). Genuine LR key blank from LR Centre Huddersfield (<strong>£159.36</strong>). MOT retest + new number plates at Rocar Moores LR (<strong>£70.59</strong>). A-service at Rocar Moores LR — 61,954 miles, service book stamped.</>, alt: true },
              { year: '2014', docs: '3 invoices', text: null, jsx: <>MOT preparation — bushes, bolts, hardware (<strong>£356.83</strong>). Engine sump repair — new sump pan (<strong>£199.69</strong>). Small service — oil, filter, PSF, antifreeze, wiper blades, height sensor links, service book stamped (<strong>£299.28</strong>).</> },
              { year: '2015', docs: '1 invoice', text: null, jsx: <>Major works at LR Centre Huddersfield — 71,887 miles. Discs and pads all four corners. Both front lower arms. Propshaft. Rack ends. Flexi hoses. N/S/R upper arm. Waxoyl. 4-wheel alignment. A-service. SKF hub. 10.18 hrs labour. <strong>£2,228.94.</strong></>, alt: true },
              { year: '2016', docs: '4 invoices', text: null, jsx: <>Full clutch kit — plate, cover, bearing, flywheel, slave cylinder, gear select sensor (<strong>£1,186.27</strong>). New N/S/F caliper (<strong>£267.59</strong>). Lower steering shaft — safety item (<strong>£156.66</strong>). Full service — new alternator, turbo actuator, diff seal, turbo pipes, hub bearing, 10.5 hrs (<strong>£1,260.80</strong>).</> },
              { year: '2017', docs: '2 invoices', text: null, jsx: <>Rear pad wear sensor replaced (<strong>£147.24</strong>). Major service — front and rear timing belts, alternator belt and tensioner, wheel nuts, front discs and pads, 5W30 Petronas oil, 10.25 hrs (<strong>£1,084.80</strong>). MOT March 2017 — PASS, no advisories.</>, alt: true },
              { year: '2018', docs: '1 invoice', text: null, jsx: <>Full service — 97,986 miles. Front and rear discs and pads. Pad wear sensors. O/S/F CV boot. Drive shaft gaiter. Road test all OK. <strong>£766.13.</strong> MOT March 2018 — PASS, no advisories.</> },
              { year: '2019', docs: '1 invoice', text: null, jsx: <>Major works — 101,858 miles. Front discs, pads and O/S/F caliper. New OEM AMK air conditioning compressor. Air con condenser. Full air con service. LR SDD diagnostics. 6 hrs. Road test all OK. <strong>£1,520.55.</strong></>, alt: true },
              { year: '2020', docs: '2 invoices', text: null, jsx: <>Major service — 104,471 miles. Both EGR valves OEM (LH and RH). New wiring harness. Hub bearing. Handbrake shoes. Brake caliper RH. B-service, brake fluid. No-power complaint investigated and resolved. <strong>£1,838.14.</strong> MOT March 2020 — PASS, no advisories (<strong>£55.00</strong>).</> },
              { year: '2021', docs: '3 invoices', text: null, jsx: <>New O/S/F headlamp unit — OEM (<strong>£295.10</strong>). MOT retest April 2021 — PASS at 110,053 miles. Full service at Inverness 4x4 Centre — 112,951 miles, all filters, new oil, rear brakes serviced, OEM JLR handbrake switch (<strong>£450.86</strong>).</>, alt: true },
              { year: '2022', docs: '3 invoices', text: null, jsx: <>ABS diagnostics — broken drive shaft shield removed, ABS ring cleaned, new OEM RH rear ABS sensor (<strong>£313.20</strong>). New Continental CrossContact 255/60R18 tyre (<strong>£150.00</strong>). MOT April 2022 — PASS (<strong>£54.85</strong>).</> },
              { year: 'Early\n2023', docs: '1 invoice', text: null, jsx: <><em style={{ color: '#666' }}>(Previous keeper — final work before sale.)</em> Front brake discs, pads, both front brake back plates, RH front hub bearing at Inverness 4x4 Centre — 118,617 miles. <strong>£929.71.</strong></>, alt: true },
              { year: '2023', docs: '2 invoices — current keeper from April 2023', text: null, jsx: <>Full service at Catshill Garage, Bromsgrove — 122,118 miles. All filters, engine oil, PSF, antifreeze, injector cleaner, screenwash. Service book stamped (<strong>£384.75</strong>). Exhaust outlet pipe repaired (<strong>£222.35</strong>).</>, current: true },
              { year: '2024', docs: '4 invoices / receipts', text: null, jsx: <>New OEM AMK air suspension pump + OEM JLR air tank — MJA Landrover Ltd, 139,635 miles, Autologic diagnostics (<strong>£1,354.29</strong>). Two new Continental CrossContact 255/60R18 — two receipts (<strong>£156.00 each</strong>). All MOT failure items rectified — brake hose, wishbone, headlamps, MOT pass (<strong>£608.43</strong>).</>, current: true, alt: true },
              { year: '2025', docs: '4 invoices / receipts', text: null, jsx: <>Both front calipers OEM, discs &times;2 OEM, pads OEM, hub bearing OEM, brake fluid — MJA Landrover Ltd (<strong>£933.35</strong>). New Shield battery (guarantee to Jan 2027) + wiper blades (<strong>£164.97</strong>). Rear bearing kit OEM + rear back plate (<strong>£498.96</strong>). ARB drop link, sidelight, MOT — <strong>zero advisory pass</strong> (<strong>£126.59</strong>).</>, current: true },
              { year: '2026', docs: '1 receipt', text: 'Two new Continental CrossContact 255/60R18 tyres — Wombourne Tyres Ltd, May 2026. Receipt to be added to pack.', current: true, alt: true },
            ].map(({ year, docs, text, jsx, current, alt }, i) => (
              <tr key={i} style={{ background: current && alt ? '#f6f9f6' : alt ? '#fafafa' : current ? '#f6f9f6' : undefined }}>
                <td style={{ width: 80, fontFamily: "'Courier New',Courier,monospace", fontSize: 12, color: current ? '#2a6e38' : '#555', padding: '10px 14px 10px 0', verticalAlign: 'top', textAlign: 'right' as const, borderRight: `2px solid ${current ? '#b8d8ba' : '#d0d0d0'}`, fontWeight: current ? 700 : 600, whiteSpace: 'pre-line' as const }}>{year}</td>
                <td style={{ padding: '10px 12px 10px 14px', fontSize: 14, lineHeight: 1.6, color: '#1a1a1a', verticalAlign: 'top' }}>
                  <span style={{ background: current ? '#2a6e38' : '#555', color: '#fff', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, marginRight: 8 }}>{docs}</span>
                  {jsx ?? text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total spend summary */}
        <div style={{ marginTop: 12, border: '1px solid #b8d8ba', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ background: '#2a6e38', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 10 }}>
            <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#c8e8ca', letterSpacing: '0.06em', textTransform: 'uppercase' as const, fontWeight: 700 }}>Total documented expenditure on this vehicle</div>
            <div style={{ fontFamily: "'Courier New',Courier,monospace", fontSize: 26, fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>~£17,800</div>
          </div>
          <div style={{ background: '#f6f9f6', padding: '12px 18px', display: 'flex', gap: 0, flexWrap: 'wrap' as const }}>
            <div style={{ flex: 1, minWidth: 180, padding: '6px 16px 6px 0', borderRight: '1px solid #d0e8d2' }}>
              <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#888', marginBottom: 3 }}>Previous keeper 2012–2023</div>
              <div style={{ fontFamily: "'Courier New',Courier,monospace", fontSize: 18, fontWeight: 700, color: '#2a6e38' }}>~£13,000</div>
            </div>
            <div style={{ flex: 1, minWidth: 180, padding: '6px 0 6px 16px' }}>
              <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#888', marginBottom: 3 }}>Current keeper 2023–2026</div>
              <div style={{ fontFamily: "'Courier New',Courier,monospace", fontSize: 18, fontWeight: 700, color: '#2a6e38' }}>~£4,800</div>
            </div>
          </div>
          <div style={{ background: '#edf7ee', padding: '10px 18px', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 12, color: '#3a6e40', lineHeight: 1.6, borderTop: '1px solid #c8e4ca' }}>
            All invoices and receipts are original documents, present at the vehicle and available for inspection at collection. Every invoice cross-references VIN SALLAAA178A451416.
          </div>
        </div>
      </div>

      {/* ===== ITEMS TO BE AWARE OF ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 10 }}>Items to be aware of — declared honestly</div>
        <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>None of the following caused a failure at the October 2025 MOT. The car holds a current zero-advisory pass. They are declared here because a buyer deserves to know.</p>

        {/* Windscreen */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a' }}>
              <strong>Windscreen crack</strong> — runs from the bottom edge toward the passenger side. Outside the driver's primary eyeline. Passed Oct 2025 MOT as a minor item. Needs replacement in due course. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=0s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>Visible on video.</a>
            </div>
          </div>
        </div>

        {/* Alloy wheels */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a' }}>
              <strong>Alloy wheels</strong> — paint peeling and flaking on all four 18-inch anthracite alloys. Structurally sound; require cosmetic refurbishment. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=80s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>See on video at 01:20.</a> All four corners photographed in the wheels section above.
            </div>
          </div>
        </div>

        {/* Centre console armrest — with inline image */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a', width: '100%' }}>
              <strong>Centre console armrest</strong> — significant delamination and tearing of the leather/vinyl surface. Needs a replacement lid. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=412s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>Close-up at 06:52 on video.</a>
              <div style={{ marginTop: 10 }}>
                <a href={`${B}/interior-centre-console-arm-rest-damage.jpg`} target="_blank" rel="noopener noreferrer">
                  <Image src={`${B}/interior-centre-console-arm-rest-damage.jpg`} alt="Centre armrest delamination" width={420} height={315} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', borderRadius: 4 }} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Gear stick gaiter — with inline image */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a', width: '100%' }}>
              <strong>Gear stick gaiter</strong> — leather cracked, peeling and deteriorated. A straightforward cosmetic replacement. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=120s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>See at 02:00 on video.</a>
              <div style={{ marginTop: 10 }}>
                <a href={`${B}/interior-gear-stick-gaitor-worn.jpg`} target="_blank" rel="noopener noreferrer">
                  <Image src={`${B}/interior-gear-stick-gaitor-worn.jpg`} alt="Gear stick gaiter worn" width={420} height={315} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', borderRadius: 4 }} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Headlining — with inline image */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a', width: '100%' }}>
              <strong>Headlining</strong> — marks requiring cleaning; two small tears: one on the A-pillar, one on the rear centre of the roof. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=164s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>See at 02:44 on video.</a>
              <div style={{ marginTop: 10 }}>
                <a href={`${B}/interior-headlining.jpg`} target="_blank" rel="noopener noreferrer">
                  <Image src={`${B}/interior-headlining.jpg`} alt="Headlining marks and tears" width={420} height={315} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', borderRadius: 4 }} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Parking sensors */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a' }}>
              <strong>Rear parking sensors</strong> — constant tone for approximately 2 seconds on engaging reverse, then silence. Likely a failed sensor or wiring fault. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=888s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>Clearly audible at 14:48 on video.</a>
            </div>
          </div>
        </div>

        {/* Driver's headlamp */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a' }}>
              <strong>Driver's headlamp lens</strong> — very mild hazing compared to the passenger unit (replaced OEM April 2021). Only noticeable on direct side-by-side comparison.
            </div>
          </div>
        </div>

        {/* Underside rattle */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a' }}>
              <strong>Underside rattle</strong> — intermittent metallic vibration from underside at idle. Suspected loose heat shield. Not yet diagnosed.
            </div>
          </div>
        </div>

        {/* Rear sill rust — with 3-col inline images */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a', width: '100%' }}>
              <strong>Rear sill rust</strong> — visible rust on both rear sills where the sill meets the rear wheel arch. Surface rust, did not fail MOT. Shown on both sides below. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=141s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>See at 02:21 on video.</a>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 10 }}>
                <div>
                  <a href={`${B}/exterior-rear-sil-rust-driver.jpg`} target="_blank" rel="noopener noreferrer">
                    <Image src={`${B}/exterior-rear-sil-rust-driver.jpg`} alt="Rear sill rust — driver side" width={240} height={180} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
                  </a>
                  <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', marginTop: 4 }}>Driver side rear sill</div>
                </div>
                <div>
                  <a href={`${B}/exterior-rear-sil-rust-passenger.jpg`} target="_blank" rel="noopener noreferrer">
                    <Image src={`${B}/exterior-rear-sil-rust-passenger.jpg`} alt="Rear sill rust — passenger side" width={240} height={180} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
                  </a>
                  <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', marginTop: 4 }}>Passenger side rear sill</div>
                </div>
                <div>
                  <a href={`${B}/underside-rear-sapre-wheel.jpg`} target="_blank" rel="noopener noreferrer">
                    <Image src={`${B}/underside-rear-sapre-wheel.jpg`} alt="Underside rear and spare wheel area" width={240} height={180} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 4 }} />
                  </a>
                  <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', marginTop: 4 }}>Underside rear / spare wheel area</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Underside corrosion — with inline image */}
        <div style={{ marginBottom: 10, padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a', width: '100%' }}>
              <strong>Underside corrosion</strong> — surface rust visible throughout the underside as expected on an 18-year-old vehicle. Small hole in ladder chassis at rear. Did not fail MOT. <a href="https://www.youtube.com/watch?v=wbIp_eK1aIE&t=706s" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>Underside shown in full at 11:46 on video.</a>
              <div style={{ marginTop: 10 }}>
                <a href={`${B}/underside-front-sureface-corrosion.jpg`} target="_blank" rel="noopener noreferrer">
                  <Image src={`${B}/underside-front-sureface-corrosion.jpg`} alt="Underside front surface corrosion" width={420} height={315} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', borderRadius: 4 }} />
                </a>
                <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, color: '#999', marginTop: 4 }}>Front underside surface corrosion — click to enlarge</div>
              </div>
            </div>
          </div>
        </div>

        {/* Window rubber trim — with inline image */}
        <div style={{ padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a', width: '100%' }}>
              <strong>Window rubber trim</strong> — bubbling beneath the plastic strip along the bottom of the window.
              <div style={{ marginTop: 10 }}>
                <a href={`${B}/exterior-drivers-door-window-rubber-bubbling.jpg`} target="_blank" rel="noopener noreferrer">
                  <Image src={`${B}/exterior-drivers-door-window-rubber-bubbling.jpg`} alt="Window rubber trim bubbling" width={420} height={315} style={{ width: '100%', maxWidth: 420, height: 'auto', display: 'block', borderRadius: 4 }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== DOCUMENTATION ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Documentation included</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ["\uD83D\uDCD6  Original Owner's Handbook", '\uD83D\uDCD6  Quick Start Guide'],
              ['\uD83D\uDCD6  Navigation System Handbook', '\uD83D\uDCD6  Land Rover Assistance Handbook'],
              ['\uD83D\uDCC4  Extended Warranty Handbook', '\uD83D\uDCC4  Original stamped Service Portfolio — 8 stamps from new'],
              ['\uD83D\uDCC4  V5C — present', '\uD83D\uDCC4  Current MOT certificate (valid Oct 2026)'],
              ['\uD83D\uDCC1  Full original invoice file', '\uD83D\uDD11  2 keys (incl. receipted LR blank)'],
            ].map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '7px 10px', border: '1px solid #e8e8e8', fontSize: 14, color: '#1a1a1a', background: i % 2 === 0 ? '#fafafa' : undefined }}>{cell}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ padding: '7px 10px', border: '1px solid #e8e8e8', fontSize: 14, color: '#1a1a1a' }}>{'\uD83D\uDCC5'}  All documents in the original Land Rover leather document wallet</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ===== PRACTICAL DETAILS ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Practical details</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              { label: 'Location', value: 'Wombourne, WV5, West Midlands.' },
              { label: 'Collection', value: 'Collection only. Sold as seen.' },
              { label: 'Questions', value: 'Very welcome. I have the complete invoice file to hand and can answer detailed questions about any aspect of the history.' },
              { label: 'Video', value: null },
            ].map(({ label, value }) => (
              <tr key={label}>
                <td style={{ width: 130, fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#999', padding: '9px 12px 9px 0', verticalAlign: 'top', borderBottom: label !== 'Video' ? '1px solid #f0f0f0' : undefined }}>{label}</td>
                <td style={{ fontSize: 14, lineHeight: 1.6, color: '#1a1a1a', padding: '9px 0', borderBottom: label !== 'Video' ? '1px solid #f0f0f0' : undefined }}>
                  {value ?? <>Please watch the 18-minute walkround video before bidding. It shows every area of the car honestly and will answer most questions. <a href="https://youtu.be/wbIp_eK1aIE" target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a' }}>Watch on YouTube.</a></>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== CLOSING ===== */}
      <div style={{ background: '#253328', borderRadius: 8, padding: 32, textAlign: 'center' as const }}>
        <div style={{ background: '#f2c200', color: '#111', fontFamily: "'Courier New',Courier,monospace", fontSize: 22, fontWeight: 700, padding: '6px 20px', borderRadius: 5, letterSpacing: '0.1em', display: 'inline-block', marginBottom: 20, border: '2px solid #c9a000' }}>BP07 PMO</div>
        <p style={{ fontSize: 17, lineHeight: 1.8, color: '#c8e0ca', margin: '0 0 12px', fontStyle: 'italic' }}>
          A properly honest, fully documented Discovery 3 with a genuinely rare colour, a rare manual gearbox, and a paper trail that goes back to the day it was new. If you have been looking for a D3 you can buy with confidence, this is it.
        </p>
        <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 12, color: '#4a7a50', margin: 0 }}>
          VIN: SALLAAA178A451416 &nbsp;·&nbsp; First registered 31 July 2007 &nbsp;·&nbsp; 4th keeper &nbsp;·&nbsp; MOT valid to 26 October 2026
        </p>
      </div>

    </div>
  )
}
