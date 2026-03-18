import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import AccountNameForm from '@/components/AccountNameForm'
import AccountPasswordForm from '@/components/AccountPasswordForm'
import SignOutButton from '@/components/SignOutButton'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt))

  return (
    <main className="account-main">
      <div className="account-wrap">
        <h1 className="account-title">
          {session.user.name ? `Hello, ${session.user.name.split(' ')[0]}.` : 'Your account.'}
        </h1>

        <p className="account-email">{session.user.email}</p>

        {/* Order history */}
        <section className="account-section">
          <h2 className="account-section-title">Orders</h2>
          {userOrders.length === 0 ? (
            <p className="account-empty">No orders yet.</p>
          ) : (
            <ul className="account-orders">
              {userOrders.map((order) => (
                <li key={order.id} className="account-order">
                  <div className="account-order-meta">
                    <span className="account-order-date">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                    <span className={`account-order-status account-order-status--${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="account-order-total">
                    £{(order.totalAmount / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Update name */}
        <section className="account-section">
          <h2 className="account-section-title">Your name</h2>
          <AccountNameForm currentName={session.user.name ?? ''} />
        </section>

        {/* Change password */}
        <section className="account-section">
          <h2 className="account-section-title">Change password</h2>
          <AccountPasswordForm />
        </section>

        {/* Sign out */}
        <section className="account-section">
          <SignOutButton />
        </section>
      </div>
    </main>
  )
}
