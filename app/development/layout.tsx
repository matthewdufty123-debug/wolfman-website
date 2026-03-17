// The development page uses its own dark terminal aesthetic regardless of the
// user's theme preference. Wrapping in .page-dev applies the dark background
// and JetBrains Mono font without touching <body>.
export default function DevelopmentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="page-dev" style={{ minHeight: '100vh' }}>
      {children}
    </div>
  )
}
