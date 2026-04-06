import type { Metadata } from 'next'
import Link from 'next/link'
import { siteMetadata } from '@/lib/metadata'
import { releases, type FeatureStatus, type ReleaseStatus } from '@/lib/releases'
import SectionHeader from '@/components/SectionHeader'

export const metadata: Metadata = siteMetadata({
  title: 'Features',
  description: 'What we are building and when — the wolfman.app release roadmap.',
  path: '/features',
})

function releaseStatusLabel(status: ReleaseStatus) {
  if (status === 'live') return <span className="features-release-status features-release-status--live">Live</span>
  if (status === 'in-progress') return <span className="features-release-status features-release-status--in-progress">In Progress</span>
  return <span className="features-release-status features-release-status--planned">Planned</span>
}

function featureStatusBadge(status: FeatureStatus) {
  if (status === 'built') return <span className="features-status features-status--built">Built</span>
  if (status === 'in-development') return <span className="features-status features-status--in-development">In Development</span>
  return <span className="features-status features-status--coming-soon">Coming Soon</span>
}

export default function FeaturesPage() {
  return (
    <main className="features-page">
      <SectionHeader section="discover" current="/features" />
      <div className="features-header">
        <p className="beta-eyebrow">Product Roadmap</p>
        <h1 className="features-title">What we&apos;re building.</h1>
        <p className="features-intro">
          Nine releases. Each one adds something real. This is the honest, plain-English
          version of where wolfman.app is going and what arrives in each release.
          If you want to see the technical detail behind this —
          the GitHub issues, open branches, and development stats —
          head to the{' '}
          <Link href="/dev" className="features-link">development page</Link>.
        </p>
      </div>

      <div className="features-releases">
        {releases.map((release) => (
          <div key={release.version} className="features-release">
            <div className="features-release-header">
              <div className="features-release-meta">
                <span className="features-version-badge">v{release.version}</span>
                <h2 className="features-release-name">{release.name}</h2>
                {releaseStatusLabel(release.status)}
              </div>
              <p className="features-tagline">{release.tagline}</p>
            </div>

            <ul className="features-list">
              {release.features.map((feature) => (
                <li key={feature.name} className="features-item">
                  <div className="features-item-main">
                    <span className="features-item-name">{feature.name}</span>
                    <span className="features-item-desc">{feature.description}</span>
                  </div>
                  {featureStatusBadge(feature.status)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="features-footer">
        <p>
          Something you&apos;d love to see?{' '}
          <Link href="/feedback" className="features-link">Tell Matthew via the feedback form.</Link>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <Link href="/terms" className="features-link" style={{ fontSize: '0.85rem', opacity: 0.7 }}>Terms &amp; Conditions</Link>
          {' · '}
          <Link href="/dev" className="features-link" style={{ fontSize: '0.85rem', opacity: 0.7 }}>Technical development log</Link>
        </p>
      </div>
    </main>
  )
}
