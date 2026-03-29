import type { Metadata } from 'next'
import { noindexMetadata } from '@/lib/metadata'
import {
  ASSUMPTIONS,
  THREE_YEAR_TARGETS,
  CHART_REVENUE,
  CHART_USERS,
  DATA_BASE,
  SCENARIO_PARAMS,
  getThreeYearSnapshot,
} from '@/lib/investment-model'
import { RevenueChart, UserGrowthChart, DataTable } from './InvestmentCharts'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = noindexMetadata('Investment Case')

function fmtGBP(v: number) {
  return `£${v.toLocaleString('en-GB')}`
}

export default function InvestmentPage() {
  const snapshotConservative = getThreeYearSnapshot('conservative')
  const snapshotBase         = getThreeYearSnapshot('base')
  const snapshotOptimistic   = getThreeYearSnapshot('optimistic')

  return (
    <main className="inv-page">
      <SectionHeader section="discover" current="/investment" />

      {/* ── Hero ── */}
      <div className="inv-hero">
        <p className="inv-eyebrow">The Investment Case</p>
        <h1 className="inv-heading">Building something worth backing.</h1>
        <p className="inv-intro">
          This page exists because I believe the people who use Wolfman deserve to understand
          what I am trying to build — and whether it will still be here in two years.
          It starts with my own investment of time and money. At key milestones, it
          may open to external investors. Either way, you should know the plan.
        </p>
        <p className="inv-intro">
          Everything on this page is honest. The assumptions are documented, the targets
          are real, and the risks are named.
        </p>
      </div>

      {/* ── What Wolfman is ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">What Wolfman is</h2>
        <p className="inv-body">
          Wolfman is a mindful morning journalling app. Users log their daily intentions,
          morning routine activity, and evening reflections. Over time, data
          accumulates — habit patterns, mood trends, consistency streaks — building
          a personal picture of how inner life connects to outer routine.
        </p>
        <p className="inv-body">
          The site you are reading is the public beta. Revenue comes entirely
          from subscriptions. There are no ads. There will never be ads.
        </p>
        <p className="inv-body">
          Wolfman also has a shop — photography canvases and prints, wellbeing-themed
          clothing — but shop revenue is separate from this plan and not included in
          the forecasts below.
        </p>
      </section>

      {/* ── The Retention Engine ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">The Retention Engine</h2>
        <p className="inv-body">
          The question any investor asks is: why do people come back?
        </p>
        <p className="inv-body">
          Free tier users track their daily intentions and morning ritual activity,
          build consistency streaks, and earn achievements for showing up.
          Small recognitions that make the habit feel worth keeping.
        </p>
        <p className="inv-body">
          Premium subscribers unlock what the habit earns them:
        </p>
        <ul className="inv-list">
          <li>Advanced analytics showing how rituals connect to mood and energy over time</li>
          <li>WOLF|BOT — the AI journalling assistant — for deeper reflection and review</li>
          <li>Communities — shared spaces to grow alongside others with similar intentions</li>
          <li>An expanded achievements system tied to ritual milestones, beyond what the free tier unlocks</li>
        </ul>
        <p className="inv-body">
          The pattern is deliberate. We do not lock away the basics. We give people enough
          to fall in love with the habit — then offer the tools to go deeper.
        </p>
      </section>

      {/* ── Revenue Model ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">Revenue model</h2>
        <p className="inv-body">One product. One price.</p>
        <div className="inv-price-cards">
          <div className="inv-price-card">
            <p className="inv-price-label">Monthly</p>
            <p className="inv-price-amount">£4</p>
            <p className="inv-price-note">per month, cancel any time</p>
          </div>
          <div className="inv-price-card inv-price-card--featured">
            <p className="inv-price-label">Yearly</p>
            <p className="inv-price-amount">£36</p>
            <p className="inv-price-note">per year — three months free</p>
          </div>
        </div>
        <p className="inv-body">
          No ads. No sponsorships. No data sold. The only way Wolfman makes money
          is if people find it worth paying for.
        </p>
      </section>

      {/* ── The Two Customer Types ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">How free users become subscribers</h2>
        <p className="inv-body">
          Not all conversions look the same. The model accounts for two distinct patterns:
        </p>
        <div className="inv-customer-types">
          <div className="inv-customer-type">
            <p className="inv-customer-type-label">The instant convert</p>
            <p className="inv-customer-type-body">
              Someone discovers Wolfman, tries it, and upgrades within the first few weeks.
              They already know what they want. We model this as <strong>5% of new monthly
              signups</strong> converting immediately.
            </p>
          </div>
          <div className="inv-customer-type">
            <p className="inv-customer-type-label">The habit convert</p>
            <p className="inv-customer-type-body">
              Someone joins on the free tier, builds a streak, feels the value accumulate
              over weeks or months, then decides to go deeper. We model this as <strong>1%
              of the existing free pool</strong> upgrading each month.
            </p>
          </div>
        </div>
        <p className="inv-body">
          The steady-state ceiling is driven by growth rate and retention — not by
          which conversion path a user takes. Both types matter.
        </p>
      </section>

      {/* ── The Assumptions ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">The assumptions</h2>
        <p className="inv-body">
          Every forecast is built on assumptions. Here are ours, documented openly
          so they can be challenged, tested against reality, and updated as the beta
          produces real data.
        </p>
        <div className="inv-table-scroll">
          <table className="inv-table inv-assumptions-table">
            <thead>
              <tr>
                <th className="inv-th inv-th--var">Variable</th>
                <th className="inv-th">What it means</th>
                <th className="inv-th inv-th--right">Base value</th>
                <th className="inv-th inv-th--note">Note</th>
              </tr>
            </thead>
            <tbody>
              {ASSUMPTIONS.map(a => (
                <tr key={a.variable} className="inv-tr">
                  <td className="inv-td inv-td--var">
                    <code className="inv-var-code">{a.variable}</code>
                  </td>
                  <td className="inv-td">{a.name}</td>
                  <td className="inv-td inv-td--right inv-td--value">{a.value}</td>
                  <td className="inv-td inv-td--note">{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Three-Year Targets ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">Three-year targets</h2>
        <p className="inv-body">
          These targets are the output of the model — not aspiration, but calculation.
          Each one requires a specific rate of growth that the product has to earn.
          The December 2028 and 2029 targets assume growth accelerates as communities,
          the achievements system, and broader word-of-mouth compound.
        </p>
        <div className="inv-targets-grid">
          {THREE_YEAR_TARGETS.map((t, i) => {
            const c = snapshotConservative[i]
            const b = snapshotBase[i]
            const o = snapshotOptimistic[i]
            return (
              <div key={t.year} className="inv-target-card">
                <p className="inv-target-year">{t.year}</p>
                <p className="inv-target-amount">{fmtGBP(t.target)}</p>
                <p className="inv-target-label">annual revenue target</p>
                <div className="inv-target-scenarios">
                  <div className="inv-scenario-row">
                    <span className="inv-scenario-dot" style={{ background: '#909090' }} />
                    <span className="inv-scenario-name">Conservative</span>
                    <span className={`inv-scenario-val ${b.annualRunRate >= t.target ? '' : 'inv-scenario-val--miss'}`}
                      style={{ color: '#909090' }}>
                      {fmtGBP(c.annualRunRate)}
                    </span>
                  </div>
                  <div className="inv-scenario-row">
                    <span className="inv-scenario-dot" style={{ background: '#4A7FA5' }} />
                    <span className="inv-scenario-name">Base Case</span>
                    <span className={`inv-scenario-val ${b.annualRunRate >= t.target ? 'inv-scenario-val--hit' : 'inv-scenario-val--miss'}`}>
                      {fmtGBP(b.annualRunRate)}
                    </span>
                  </div>
                  <div className="inv-scenario-row">
                    <span className="inv-scenario-dot" style={{ background: '#3AB87A' }} />
                    <span className="inv-scenario-name">Optimistic</span>
                    <span className="inv-scenario-val inv-scenario-val--hit" style={{ color: '#3AB87A' }}>
                      {fmtGBP(o.annualRunRate)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Growth Forecast Chart ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">24-month growth forecast</h2>
        <p className="inv-body">
          Annual revenue run rate across three scenarios — April 2026 to March 2028.
          The dashed red line marks the £100,000 target.
        </p>
        <p className="inv-scenario-key">
          <span style={{ color: '#909090' }}>— Conservative</span>
          {' · '}
          <span style={{ color: '#4A7FA5' }}>— Base Case</span>
          {' · '}
          <span style={{ color: '#3AB87A' }}>— Optimistic</span>
        </p>
        <RevenueChart data={CHART_REVENUE} />

        <div className="inv-spacer" />

        <p className="inv-subsection-heading">Free tier vs premium subscribers (Base Case)</p>
        <UserGrowthChart data={CHART_USERS} />
      </section>

      {/* ── Monthly Data Table ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">Monthly breakdown — Base Case</h2>
        <p className="inv-body">
          Month-by-month detail for the base case scenario.
          Swipe right to see all columns.
        </p>
        <DataTable data={DATA_BASE} />
        <p className="inv-table-note">
          Variables: Z={SCENARIO_PARAMS.base.Z} · X_new={SCENARIO_PARAMS.base.X_new * 100}% ·
          X_existing={SCENARIO_PARAMS.base.X_existing * 100}% · Y={SCENARIO_PARAMS.base.Y * 100}% ·
          W={SCENARIO_PARAMS.base.W * 100}% · Price £4/mo · £36/yr
        </p>
      </section>

      {/* ── Feature Milestones ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">Product milestones</h2>
        <p className="inv-body">
          The growth targets above assume the product continues to earn its subscribers.
          These are the releases that unlock the next tier of growth.
        </p>
        <div className="inv-milestones">
          <div className="inv-milestone">
            <p className="inv-milestone-date">June 2026</p>
            <p className="inv-milestone-name">WOLF|BOT — Release 0.2</p>
            <p className="inv-milestone-desc">
              AI journalling assistant with personality modes, deeper review,
              and journal title generation. First premium-exclusive feature.
            </p>
          </div>
          <div className="inv-milestone">
            <p className="inv-milestone-date">July 2026</p>
            <p className="inv-milestone-name">Communities — Release 0.3</p>
            <p className="inv-milestone-desc">
              Community walls, public and private groups. Shared intentions,
              collective streaks. The social layer that makes the habit
              harder to break.
            </p>
          </div>
          <div className="inv-milestone">
            <p className="inv-milestone-date">August 2026</p>
            <p className="inv-milestone-name">Achievements — Release 0.6</p>
            <p className="inv-milestone-desc">
              Full achievements system. Badges, ritual milestones, streak achievements.
              General achievements available free. Premium unlocks ritual-specific
              achievements and deeper recognition.
            </p>
          </div>
          <div className="inv-milestone">
            <p className="inv-milestone-date">August 2026</p>
            <p className="inv-milestone-name">Statistics — Release 0.5</p>
            <p className="inv-milestone-desc">
              Advanced analytics: how mood, energy, and ritual consistency
              connect over time. A core premium value proposition.
            </p>
          </div>
          <div className="inv-milestone inv-milestone--conditional">
            <p className="inv-milestone-date">If financially sustainable</p>
            <p className="inv-milestone-name">Native Mobile App — Android &amp; iOS</p>
            <p className="inv-milestone-desc">
              If the subscription model proves viable, I will invest in native
              applications on both platforms. Morning journalling belongs in
              your pocket. A mobile app is the natural next step — and the one
              most likely to accelerate Z.
            </p>
          </div>
        </div>
      </section>

      {/* ── Our Commitment ── */}
      <section className="inv-section">
        <h2 className="inv-section-heading">Our commitment to you</h2>
        <p className="inv-body">
          Wolfman is evaluated one year at a time. I invest one year forward — in
          infrastructure, development, and my own time. At each annual review, I
          assess whether the service is financially sustainable given the growth rate
          and the cost of maintaining it.
        </p>
        <p className="inv-body">
          If at any point it is not: I will give notice. You will have one month to
          export everything you have written here. After that month, the service closes.
          This is not a hedge. It is a promise.
        </p>
        <p className="inv-body">
          The terms of this commitment are written into the{' '}
          <a href="/terms" className="inv-link">Terms of Use</a>.
          Your data belongs to you. It always will.
        </p>
      </section>

      {/* ── Footer note ── */}
      <div className="inv-footer-note">
        <p>
          This page is updated as the model is refined and as real data replaces
          assumptions. Last updated: March 2026.
        </p>
        <p>
          Wolfman is a personal project by{' '}
          <a href="/about" className="inv-link">Matthew Wolfman</a>.
        </p>
      </div>

    </main>
  )
}
