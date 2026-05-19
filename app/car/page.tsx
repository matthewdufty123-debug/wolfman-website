/* eslint-disable react/no-unescaped-entities */
// Faithful replica of the eBay listing HTML — inline styles preserved exactly.
// Enhanced with photo galleries, lightbox, embedded video, and auction banner.

import CarGallery from './CarGallery'
import {
  exteriorImages,
  engineImages,
  interiorImages,
  wheelImages,
  undersideImages,
  docsImages,
  attentionImages,
  allImages,
} from './image-groups'

export default function CarPage() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: "Georgia,'Times New Roman',serif", color: '#1a1a1a', background: '#fff', padding: '20px 0' }}>

      {/* ===== AUCTION BANNER ===== */}
      <div style={{ background: '#1a1a1a', padding: '12px 32px', borderRadius: '8px 8px 0 0', marginBottom: 0, textAlign: 'center' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' as const }}>
        <span style={{ background: '#f2c200', color: '#111', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 4, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>AUCTION PREVIEW</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13 }}>This car is coming soon to eBay — watch, save, get ready to bid.</span>
      </div>

      {/* ===== HERO ===== */}
      <div style={{ background: '#253328', padding: '40px 32px 32px', borderRadius: '0 0 0 0', marginBottom: 4 }}>
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
      <div style={{ background: '#1a2620', padding: '14px 32px', borderRadius: '0 0 8px 8px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: '#f2c200', color: '#111', fontFamily: "'Courier New',Courier,monospace", fontSize: 22, fontWeight: 700, padding: '5px 18px', borderRadius: 5, letterSpacing: '0.1em', border: '2px solid #c9a000' }}>BP07 PMO</div>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#6a9272' }}>VIN: SALLAAA178A451416 &nbsp;·&nbsp; Engine: 0240857276DT &nbsp;·&nbsp; V5C: CT 5431033</div>
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
              { t: 888, code: '14:48', label: '⚠ Parking sensor fault audible', bold: true },
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
          This is a <strong>genuinely rare and thoroughly documented Discovery 3</strong> — a special-order Keswick Green example that stands apart from the sea of Bonatti Grey and Zermatt Silver cars you'll find on the market. Keswick Green was a Defender colour, available on the D3 by special order only. You simply do not see them.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.8, margin: '0 0 14px', color: '#1a1a1a' }}>
          Paired with a <strong>6-speed manual ZF gearbox</strong> — fitted to only a small fraction of Discovery 3s, the vast majority of which were automatic — this car draws a second look wherever it goes, from both enthusiasts and casual observers.
        </p>
        {/* Callout */}
        <div style={{ background: '#f6f9f6', borderLeft: '4px solid #2a6e38', borderRadius: '0 6px 6px 0', padding: '16px 20px', margin: '20px 0', fontStyle: 'italic', fontSize: 15, lineHeight: 1.75, color: '#2a2a2a' }}>
          Bought new by a Land Rover company fleet operation in 2007 and maintained throughout its life exclusively by Land Rover franchised dealers and dedicated Land Rover specialists — from Gateshead to Huddersfield to Inverness to Bromsgrove. The paper trail is exceptional.
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.8, margin: '0 0 14px', color: '#1a1a1a' }}>
          The car has covered approximately <strong>172,873 miles over 18 years</strong> — around 9,600 a year — and has been used as a daily driver under the current owner, covering significant motorway mileage. The engine runs excellently, returning <strong>31MPG real-world</strong> on regular runs (on-board computer reads 33MPG). Terrain Response, air suspension and all four-wheel-drive systems work correctly across all settings.
        </p>

        {/* Exterior photo gallery */}
        <CarGallery images={exteriorImages} allImages={allImages} />
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
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
        <CarGallery images={engineImages} allImages={allImages} />
      </div>

      {/* ===== INTERIOR GALLERY ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Interior</div>
        <CarGallery images={interiorImages} allImages={allImages} />
      </div>

      {/* ===== WHEELS & TYRES GALLERY ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Wheels &amp; tyres</div>
        <CarGallery images={wheelImages} allImages={allImages} />
      </div>

      {/* ===== UNDERSIDE ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Underside</div>
        <CarGallery images={undersideImages} allImages={allImages} />
      </div>

      {/* ===== WHY THIS ONE ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Why this one</div>
        {[
          { title: 'Zero-advisory MOT to October 2026.', desc: 'The October 2025 test at 163,030 miles returned the cleanest possible result. This followed new front calipers, discs and pads, new ARB drop link, seatbelt replacements, and all advisory items from prior tests fully resolved.' },
          { title: 'Exceptional paper trail.', desc: '8 service stamps from 6 Land Rover dealers commencing at 5 miles from new, backed by a continuous file of original invoices from 2012 onwards. Every item cross-references the correct VIN. Approximately £17,800 of combined documented expenditure.' },
          { title: '6-speed manual gearbox — the rare one.', desc: 'Full clutch kit replacement January 2016 at Land Rover Centre Huddersfield: clutch plate, cover, bearing, flywheel, concentric slave cylinder. Changes cleanly with no issues.' },
          { title: 'Special-order Keswick Green — genuinely rare on a D3.', desc: "The factory colour label is visible in the engine bay. Already sought after by enthusiasts; this is not a colour you stumble across." },
          { title: 'Factory Harman Kardon Hi-ICE — fully operational.', desc: 'Normally only on SE and HSE trim levels. All 8 speakers, passive subwoofer, fibre optic amplifier, in-dash 6-CD changer and steering wheel controls all working.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=631s', text: 'Hear it at 10:31 on the video.' } },
          { title: 'Complete original document wallet.', desc: "Owner's Handbook, Quick Start Guide, Navigation Handbook, Assistance Handbook, Extended Warranty book, original stamped Service Portfolio, V5C and current MOT certificate — all in the original Land Rover leather wallet." },
          { title: 'Two keys.', desc: 'Including one genuine Land Rover key blank purchased from Land Rover Centre Huddersfield in May 2013 (receipted at £159.36).', last: true },
        ].map(({ title, desc, link, last }) => (
          <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: last ? 0 : 14, padding: 14, background: '#f9fdf9', borderRadius: 6, border: '1px solid #ddeedd' }}>
            <div style={{ color: '#2a7a38', fontSize: 20, flexShrink: 0, lineHeight: 1 }}>&#10003;</div>
            <div style={{ fontSize: 15, lineHeight: 1.7, color: '#1a1a1a' }}>
              <strong>{title}</strong> {desc}
              {link && <> <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a' }}>{link.text}</a></>}
            </div>
          </div>
        ))}
      </div>

      {/* ===== SERVICE HISTORY TIMELINE ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 8 }}>Service &amp; repair history — year by year with invoice count</div>
        <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#666', margin: '0 0 16px', lineHeight: 1.6 }}>Every invoice and receipt listed below is an original document, present and available for inspection at viewing. All cross-reference VIN SALLAAA178A451416. Combined documented expenditure approximately <strong style={{ color: '#1a1a1a' }}>£17,800</strong>.</p>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              { year: '2007', docs: '1 document', text: 'Supplied new at 5 miles by Land Rover Company Vehicles, Rugby. Supplying dealer signed off in service book. New vehicle delivery — factory fresh.', current: true, alt: true },
              { year: '2008', docs: '1 invoice', text: 'A-service at Silverstone Land Rover, Durham — 12,841 miles. Oil service, brake fluid, coolant change, anti-corrosion inspection. Service book stamped.' },
              { year: '2009', docs: '1 invoice', text: 'B-service at Team Valley Land Rover, Gateshead — 24,568 miles. Oil service, brake fluid, coolant change, anti-corrosion inspection. Service book stamped.', alt: true },
              { year: '2010', docs: '1 invoice', text: 'A-service at Team Valley Land Rover, Gateshead — 35,247 miles. Oil service, brake fluid, coolant change, anti-corrosion inspection. Service book stamped. First MOT July 2010 — PASS, no advisories.' },
              { year: '2011', docs: '1 invoice', text: 'A-service at Team Valley Land Rover, Gateshead — 44,945 miles. Oil service, anti-corrosion inspection. Service book stamped. MOT July 2011 — PASS, no advisories.', alt: true },
              { year: '2012', docs: '3 invoices', text: <>Service at Armstrong Massey Land Rover, York — 47,747 miles, anti-corrosion inspection, service book stamped (<strong>£437.36</strong>). Customer bush bar fitted at LR Centre Huddersfield (<strong>£116.40</strong>). Rear brake discs and pads renewed with genuine LR parts at Armstrong Massey — 53,661 miles (<strong>£334.56</strong>). MOT February 2012 — PASS, no advisories.</> },
              { year: '2013', docs: '4 invoices / receipts', text: <>Parts and service at Armstrong Massey LR, York — 55,872 miles (<strong>£437.36</strong>). Genuine Land Rover key blank purchased from LR Centre Huddersfield (<strong>£159.36</strong>). MOT retest + new compliant number plates at Rocar Moores LR, Huddersfield (<strong>£70.59</strong>). A-service at Rocar Moores LR — 61,954 miles, oil service, anti-corrosion inspection, service book stamped.</>, alt: true },
              { year: '2014', docs: '3 invoices', text: <>MOT preparation at LR Centre Huddersfield — bushes, bolts, hardware (<strong>£356.83</strong>). Engine sump repair at Rocar Moores LR — new sump pan, 67,997 miles (<strong>£199.69</strong>). Small service at LR Centre Huddersfield — 68,086 miles, oil, filter, power steering fluid, antifreeze, wiper blades, height sensor links fitted, service book stamped (<strong>£299.28</strong>).</> },
              { year: '2015', docs: '1 invoice', text: <>Major works at LR Centre Huddersfield — 71,887 miles. Front and rear brake discs and pads all four corners. Both front lower arms replaced. Propshaft. Both front rack ends. Both front flexi hoses. N/S/R upper arm. Waxoyl underbody treatment. 4-wheel alignment. A-service. SKF hub assembly. 10.18 hours labour. <strong>£2,228.94.</strong></>, alt: true },
              { year: '2016', docs: '4 invoices', text: <>Full clutch kit at LR Centre Huddersfield — 73,075 miles: clutch plate, cover, bearing, flywheel, concentric slave cylinder, gear select sensor (<strong>£1,186.27</strong>). New N/S/F brake caliper — sticking brake resolved same day as MOT fail (<strong>£267.59</strong>). Lower steering shaft replaced — safety item, 78,404 miles (<strong>£156.66</strong>). Full service — new alternator, turbo actuator, diff seal, turbo pipes, front hub bearing, differential oil, 10.5 hours labour (<strong>£1,260.80</strong>).</> },
              { year: '2017', docs: '2 invoices', text: <>Brake service at LR Centre Huddersfield — rear pad wear warning sensor replaced, 81,288 miles (<strong>£147.24</strong>). Major service — front and rear timing belts, alternator belt and tensioner, 8 wheel nuts, front brake discs and pads, premium service kit, 5W30 Petronas oil, antifreeze, brake fluid, 10.25 hours labour (<strong>£1,084.80</strong>). MOT March 2017 — PASS, no advisories.</>, alt: true },
              { year: '2018', docs: '1 invoice', text: <>Full service at LR Centre Huddersfield — 97,986 miles. Front and rear brake discs and pads. Pad wear sensors. O/S/F CV boot and drive shaft gaiter replaced. Road test confirmed all OK. <strong>£766.13.</strong> MOT March 2018 — PASS, no advisories.</> },
              { year: '2019', docs: '1 invoice', text: <>Major works at LR Centre Huddersfield — 101,858 miles. Front brake discs, pads and O/S/F caliper. New OEM AMK air conditioning compressor. Air con condenser. Full air con service. Land Rover SDD diagnostics. 6 hours labour. Road test confirmed all OK. <strong>£1,520.55.</strong></>, alt: true },
              { year: '2020', docs: '2 invoices', text: <>Major service at LR Centre Huddersfield — 104,471 miles. Both EGR valves replaced OEM (LH and RH). New wiring harness. Hub and wheel bearing. Handbrake shoes and spring repair kit. Brake caliper RH. B-service including 5W30 FJ oil and DOT4 brake fluid. Customer reported no power / poor starting — investigated and fully resolved. <strong>£1,838.14.</strong> MOT March 2020 at LR Centre Huddersfield — PASS, no advisories (<strong>£55.00</strong>).</> },
              { year: '2021', docs: '3 invoices', text: <>New O/S/F headlamp unit — OEM part — LR Centre Huddersfield (<strong>£295.10</strong>). MOT retest April 2021 — PASS at 110,053 miles. Full service at Inverness 4x4 Centre — 112,951 miles, all filters, new oil, rear brakes cleaned and serviced, new OEM JLR handbrake switch, rear caliper bolts (<strong>£450.86</strong>).</>, alt: true },
              { year: '2022', docs: '3 invoices', text: <>ABS diagnostics at Inverness 4x4 Centre — broken drive shaft shield removed, ABS ring cleaned, new OEM RH rear ABS sensor (<strong>£313.20</strong>). New Continental CrossContact 255/60R18 tyre at Inverness Tyre Services (<strong>£150.00</strong>). MOT April 2022 at G McDonald Garage Services, Aviemore — PASS (<strong>£54.85</strong>).</> },
              { year: 'Early\n2023', docs: '1 invoice', text: <><em style={{ color: '#666' }}>(Previous keeper — final work before sale.)</em> Front brake discs, pads, both front brake back plates, RH front hub bearing at Inverness 4x4 Centre — 118,617 miles. <strong>£929.71.</strong></>, alt: true },
              { year: '2023', docs: '2 invoices — current keeper from April 2023', text: <>Full service at Catshill Garage, Bromsgrove — 122,118 miles. All filters replaced (oil, air, fuel, cabin), engine oil, power steering fluid, antifreeze, injector cleaner, screenwash. Service book stamped (<strong>£384.75</strong>). Exhaust outlet pipe repaired — new pipe, ends and connectors (<strong>£222.35</strong>).</>, current: true },
              { year: '2024', docs: '4 invoices / receipts', text: <>New OEM AMK air suspension pump assembly and OEM JLR air tank — MJA Landrover Ltd, Bromsgrove, 139,635 miles, Autologic diagnostics (<strong>£1,354.29</strong>). Two new Continental CrossContact 255/60R18 tyres at Wombourne Tyres Ltd — two separate receipts (<strong>£156.00 each</strong>). All MOT failure items rectified at Catshill Garage — new front brake hose, new front lower wishbone, headlamp bulbs, aim adjusted, MOT pass (<strong>£608.43</strong>).</>, current: true, alt: true },
              { year: '2025', docs: '4 invoices / receipts', text: <>Both front brake calipers OEM, front discs ×2 OEM, pads OEM, hub bearing OEM, brake fluid — MJA Landrover Ltd, 147,743 miles, Autologic diagnostics (<strong>£933.35</strong>). New Shield battery (2-year guarantee to Jan 2027) and front wiper blades — Wolverhampton Car Parts (<strong>£164.97</strong>). Rear bearing kit OEM and rear back plate — MJA Landrover Ltd, 149,063 miles (<strong>£498.96</strong>). ARB drop link, sidelight bulb, MOT at Wildmoor Truck and Plant Ltd — <strong>zero advisory pass</strong> (<strong>£126.59</strong>).</>, current: true },
              { year: '2026', docs: '1 receipt', text: 'Two new Continental CrossContact 255/60R18 tyres — Wombourne Tyres Ltd, May 2026. Receipt to be added to pack.', current: true, alt: true },
            ].map(({ year, docs, text, current, alt }, i) => (
              <tr key={i} style={{ background: current && alt ? '#f6f9f6' : alt ? '#fafafa' : current ? '#f6f9f6' : undefined }}>
                <td style={{ width: 80, fontFamily: "'Courier New',Courier,monospace", fontSize: 12, color: current ? '#2a6e38' : '#555', padding: '10px 14px 10px 0', verticalAlign: 'top', textAlign: 'right' as const, borderRight: `2px solid ${current ? '#b8d8ba' : '#d0d0d0'}`, fontWeight: current ? 700 : 600, whiteSpace: 'pre-line' as const }}>{year}</td>
                <td style={{ padding: '10px 12px 10px 14px', fontSize: 14, lineHeight: 1.6, color: '#1a1a1a', verticalAlign: 'top' }}>
                  <span style={{ background: current ? '#2a6e38' : '#555', color: '#fff', fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 3, marginRight: 8 }}>{docs}</span>
                  {text}
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
            All invoices and receipts are original documents, present at the vehicle and available for inspection at viewing. Every invoice cross-references VIN SALLAAA178A451416.
          </div>
        </div>
      </div>

      {/* ===== ITEMS TO BE AWARE OF ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 10 }}>Items to be aware of — declared honestly</div>
        <p style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 13, color: '#666', margin: '0 0 14px', lineHeight: 1.6 }}>None of the following caused a failure at the October 2025 MOT. The car holds a current zero-advisory pass. They are declared here because a buyer deserves to know.</p>
        {[
          { title: 'Windscreen crack', desc: "runs from the bottom edge toward the passenger side. Outside the driver's primary eyeline. Passed Oct 2025 MOT as a minor item. Needs replacement in due course.", link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=0s', text: 'Visible on video.' } },
          { title: 'Alloy wheels', desc: 'paint peeling and flaking on all four 18-inch anthracite alloys. Structurally sound; require cosmetic refurbishment.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=80s', text: 'See on video at 01:20.' } },
          { title: 'Centre console armrest', desc: 'significant delamination and tearing of the leather/vinyl surface. Needs a replacement lid.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=412s', text: 'Close-up at 06:52 on video.' } },
          { title: 'Gear stick gaiter', desc: 'leather cracked, peeling and deteriorated. A straightforward cosmetic replacement.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=120s', text: 'See at 02:00 on video.' } },
          { title: 'Headlining', desc: 'marks requiring cleaning; two small tears: one on the A-pillar, one on the rear centre of the roof.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=164s', text: 'See at 02:44 on video.' } },
          { title: 'Rear parking sensors', desc: 'constant tone for approximately 2 seconds on engaging reverse, then silence. Likely a failed sensor or wiring fault.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=888s', text: 'Clearly audible at 14:48 on video.' } },
          { title: "Driver's headlamp lens", desc: 'very mild hazing compared to the passenger unit (replaced OEM April 2021). Only noticeable on direct side-by-side comparison.' },
          { title: 'Underside rattle', desc: 'intermittent metallic vibration from underside at idle. Suspected loose heat shield. Not yet diagnosed.' },
          { title: 'Chassis and underside', desc: 'visible surface rust as expected on an 18-year-old vehicle. Small hole in ladder chassis at rear. Rear sills show visible rust. Did not fail MOT.', link: { href: 'https://www.youtube.com/watch?v=wbIp_eK1aIE&t=706s', text: 'Underside shown at 11:46 on video.' } },
          { title: 'Window rubber trim', desc: 'bubbling beneath the plastic strip along the bottom of the window.', last: true },
        ].map(({ title, desc, link, last }) => {
          const itemImages = attentionImages[title]
          return (
            <div key={title} style={{ marginBottom: last ? 0 : 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', border: '1px solid #f0d98a', borderRadius: 6, background: '#fffdf0' }}>
                <div style={{ color: '#b07800', fontSize: 16, flexShrink: 0 }}>&#9650;</div>
                <div style={{ fontSize: 14, lineHeight: 1.65, color: '#1a1a1a' }}>
                  <strong>{title}</strong> — {desc}
                  {link && <> <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: '#1a5c8a', fontSize: 13 }}>{link.text}</a></>}
                </div>
              </div>
              {itemImages && (
                <div style={{ paddingLeft: 40 }}>
                  <CarGallery images={itemImages} allImages={allImages} small />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ===== DOCUMENTATION ===== */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Arial,Helvetica,sans-serif', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: '#888', borderBottom: '1px solid #e0e0e0', paddingBottom: 7, marginBottom: 16 }}>Documentation included</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              ["📖  Original Owner's Handbook", '📖  Quick Start Guide'],
              ['📖  Navigation System Handbook', '📖  Land Rover Assistance Handbook'],
              ['📄  Extended Warranty Handbook', '📄  Original stamped Service Portfolio — 8 stamps from new'],
              ['📄  V5C — present', '📄  Current MOT certificate (valid Oct 2026)'],
              ['📁  Full original invoice file', '🔑  2 keys (incl. receipted LR blank)'],
            ].map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '7px 10px', border: '1px solid #e8e8e8', fontSize: 14, color: '#1a1a1a', background: i % 2 === 0 ? '#fafafa' : undefined }}>{cell}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td colSpan={2} style={{ padding: '7px 10px', border: '1px solid #e8e8e8', fontSize: 14, color: '#1a1a1a' }}>📅  All documents presented in the original Land Rover leather document wallet</td>
            </tr>
          </tbody>
        </table>

        {/* Docs & keys photo gallery */}
        <CarGallery images={docsImages} allImages={allImages} />
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
