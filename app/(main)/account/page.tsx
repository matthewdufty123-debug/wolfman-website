import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { noindexMetadata } from '@/lib/metadata'
import SectionHeader from '@/components/SectionHeader'
import AccountNameForm from '@/components/AccountNameForm'
import AccountPasswordForm from '@/components/AccountPasswordForm'
import AccountUsernameForm from '@/components/AccountUsernameForm'
import AccountPhoneForm from '@/components/AccountPhoneForm'
import SignOutButton from '@/components/SignOutButton'
import AvatarUpload from '@/components/AvatarUpload'
import { generateUniqueUsername } from '@/lib/username'

export const metadata: Metadata = noindexMetadata('My account')

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [user, userOrders] = await Promise.all([
    db.select({ avatar: users.avatar, username: users.username, phoneNumber: users.phoneNumber, phoneVerified: users.phoneVerified }).from(users).where(eq(users.id, session.user.id)).then(r => r[0]),
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
    <main className="personal-page">
      <SectionHeader section="personal" current="/account" username={username ?? ''} />
      <div className="personal-page-wrap">

        {/* Your photo */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Profile</p>
            <p className="setting-card-title">Your photo</p>
            <p className="setting-card-desc">Shown on your profile and next to your journals.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AvatarUpload currentAvatar={avatar} name={session.user.name ?? null} />
          </div>
        </div>

        {/* Your name */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Identity</p>
            <p className="setting-card-title">Your name</p>
            <p className="setting-card-desc">The name shown on your profile and in your journals.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AccountNameForm currentName={session.user.name ?? ''} />
          </div>
        </div>

        {/* Username */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Identity</p>
            <p className="setting-card-title">Username</p>
            <p className="setting-card-desc">Your public handle — it appears in your profile URL.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AccountUsernameForm currentUsername={username ?? ''} />
          </div>
        </div>

        {/* Phone number */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Identity</p>
            <p className="setting-card-title">Phone number</p>
            <p className="setting-card-desc">Used for Telegram integration. Stored securely — never shared.</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AccountPhoneForm currentPhone={user?.phoneNumber ?? null} phoneVerified={user?.phoneVerified ?? false} />
          </div>
        </div>

        {/* Password */}
        <div className="setting-card">
          <div className="setting-card-head">
            <p className="setting-card-label">Security</p>
            <p className="setting-card-title">Password</p>
          </div>
          <div className="setting-card-divider" />
          <div className="setting-card-body">
            <AccountPasswordForm />
          </div>
        </div>

        {/* Orders — only shown when the user has orders */}
        {userOrders.length > 0 && (
          <div className="setting-card">
            <div className="setting-card-head">
              <p className="setting-card-label">Shop</p>
              <p className="setting-card-title">Order history</p>
            </div>
            <div className="setting-card-divider" />
            <div className="setting-card-body">
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
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="personal-signout">
          <SignOutButton />
        </div>

      </div>
    </main>
  )
}
