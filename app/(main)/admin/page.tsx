import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { desc, count, sum, eq } from 'drizzle-orm'
import { getAllPosts } from '@/lib/posts'

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'admin') redirect('/')

  const [allPosts, recentOrders, [orderStats], [userStats]] = await Promise.all([
    getAllPosts(),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(5),
    db.select({ total: count(), revenue: sum(orders.totalAmount) }).from(orders).where(eq(orders.status, 'paid')),
    db.select({ total: count() }).from(users),
  ])

  const totalRevenue = Number(orderStats.revenue ?? 0)
  const totalOrders = Number(orderStats.total ?? 0)
  const totalUsers = Number(userStats.total ?? 0)
  const recentPosts = allPosts.slice(0, 5)

  return (
    <main className="dash-main">
      <div className="dash-wrap">

        <header className="dash-header">
          <div>
            <h1 className="dash-title">wolfman.blog</h1>
            <p className="dash-subtitle">admin dashboard</p>
          </div>
          <Link href="/admin/publish" className="dash-action-btn">
            + New post
          </Link>
        </header>

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat">
            <span className="dash-stat-value">{allPosts.length}</span>
            <span className="dash-stat-label">posts</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">{totalOrders}</span>
            <span className="dash-stat-label">paid orders</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">£{(totalRevenue / 100).toFixed(2)}</span>
            <span className="dash-stat-label">revenue</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">{totalUsers}</span>
            <span className="dash-stat-label">accounts</span>
          </div>
        </div>

        {/* Recent orders */}
        <section className="dash-section">
          <h2 className="dash-section-title">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <p className="dash-empty">No orders yet.</p>
          ) : (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="dash-muted">{order.email}</td>
                    <td>£{(order.totalAmount / 100).toFixed(2)}</td>
                    <td>
                      <span className={`dash-badge dash-badge--${order.status}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Recent posts */}
        <section className="dash-section">
          <h2 className="dash-section-title">Recent posts</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((post) => (
                <tr key={post.slug}>
                  <td className="dash-muted">{post.date}</td>
                  <td>{post.title}</td>
                  <td>
                    <span className="dash-badge dash-badge--post">{post.category}</span>
                  </td>
                  <td>
                    <Link href={`/posts/${post.slug}`} className="dash-link" target="_blank">
                      view →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Quick links */}
        <section className="dash-section">
          <h2 className="dash-section-title">Quick links</h2>
          <div className="dash-links">
            <Link href="/admin/publish" className="dash-link">Post publisher</Link>
            <Link href="/intentions" className="dash-link">All intentions</Link>
            <Link href="https://vercel.com" className="dash-link" target="_blank">Vercel dashboard</Link>
            <Link href="https://console.neon.tech" className="dash-link" target="_blank">Neon database</Link>
          </div>
        </section>

      </div>
    </main>
  )
}
