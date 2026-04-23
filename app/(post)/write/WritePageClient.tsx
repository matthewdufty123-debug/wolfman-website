'use client'

import { useState } from 'react'
import PostForm, { type RitualDef } from '@/components/PostForm'
import JournalOnboardingOverlay, { type OnboardingValues } from '@/components/JournalOnboardingOverlay'

interface Props {
  communityEnabled: boolean
  defaultPublic:    boolean
  username:         string | null
  showOnboarding:   boolean
  rituals:          RitualDef[]
}

export default function WritePageClient({ communityEnabled, defaultPublic, username, showOnboarding, rituals }: Props) {
  const [overlayDone, setOverlayDone]       = useState(false)
  const [prefill,     setPrefill]           = useState<Partial<{ intention: string; grateful: string; greatAt: string }>>({})

  const showOverlay = showOnboarding && !overlayDone

  function handleComplete(values: OnboardingValues) {
    setPrefill(values)
    setOverlayDone(true)
  }

  function handleSkip() {
    setOverlayDone(true)
  }

  return (
    <>
      {showOverlay && (
        <JournalOnboardingOverlay onComplete={handleComplete} onSkip={handleSkip} />
      )}
      <PostForm
        mode="create"
        communityEnabled={communityEnabled}
        defaultPublic={defaultPublic}
        username={username}
        initialData={Object.keys(prefill).length > 0 ? prefill : undefined}
        rituals={rituals}
      />
    </>
  )
}
