'use server'

import { signIn } from '@/auth'

export async function signInWithGitHub() {
  await signIn('github', { redirectTo: '/account' })
}

export async function signInWithGoogle() {
  await signIn('google', { redirectTo: '/account' })
}
