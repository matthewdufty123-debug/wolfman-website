import NavBar from '@/components/NavBar'

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <NavBar />
    </>
  )
}
