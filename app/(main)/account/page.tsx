import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { noindexMetadata } from '@/lib/metadata'

export const metadata: Metadata = noindexMetadata('My account')
import AccountNameForm from '@/components/AccountNameForm'
import AccountPasswordForm from '@/components/AccountPasswordForm'
import AccountUsernameForm from '@/components/AccountUsernameForm'
import AccountCommunityForm from '@/components/AccountCommunityForm'
import SignOutButton from '@/components/SignOutButton'
import AvatarUpload from '@/components/AvatarUpload'
import { generateUniqueUsername } from '@/lib/username'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user, userOrders] = await Promise.all([
    db.select({ avatar: users.avatar, username: users.username, communityEnabled: users.communityEnabled, defaultPublic: users.defaultPublic }).from(users).where(eq(users.id, session.user.id)).then(r => r[0]),
    db.select().from(orders).where(eq(orders.userId, session.user.id)).orderBy(desc(orders.createdAt)),
  ])

  const avatar = user?.avatar ?? session.user.image ?? null

  // Backfill username for existing users who pre-date the username system
  let username = user?.username ?? null
  if (!username && session.user.name) {
    username = await generateUniqueUsername(session.user.name)
    await db.update(users).set({ username }).where(eq(users.id, session.user.id))
  }

  return (
    <main className="account-main">
      <div className="account-wrap">

        {/* Avatar */}
        <AvatarUpload currentAvatar={avatar} name={session.user.name ?? null} />

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

        {/* Username */}
        <section className="account-section">
          <h2 className="account-section-title">Your username</h2>
          <p className="account-section-hint">This is your public handle — it appears in your profile URL.</p>
          <AccountUsernameForm currentUsername={username ?? ''} />
        </section>

        {/* Update name */}
        <section className="account-section">
          <h2 className="account-section-title">Your name</h2>
          <AccountNameForm currentName={session.user.name ?? ''} />
        </section>

        {/* Community settings */}
        <section className="account-section">
          <h2 className="account-section-title">Community</h2>
          <p className="account-section-hint">Control whether your journals appear in the community feed.</p>
          <AccountCommunityForm
            communityEnabled={user?.communityEnabled ?? false}
            defaultPublic={user?.defaultPublic ?? false}
          />
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
