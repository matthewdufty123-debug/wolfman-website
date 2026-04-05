'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OnboardingValues {
  intention: string
  grateful:  string
  greatAt:   string
}

interface Props {
  onComplete: (values: OnboardingValues) => void
  onSkip:     () => void
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS = [
  {
    key:       'intention' as keyof OnboardingValues,
    title:     "Today's Intention",
    prompt:    'What do you want from today?',
    hint:      'A story, an observation, a reflection that ends with a lesson or intention. Write as much or as little as feels right.',
    multiline: true,
    rows:      6,
  },
  {
    key:       'grateful' as keyof OnboardingValues,
    title:     "I'm Grateful For",
    prompt:    'What are you grateful for this morning?',
    hint:      "Something specific, vivid, and personal. Not 'my health' — more like 'the smell of coffee before anyone else is awake'.",
    multiline: true,
    rows:      4,
  },
  {
    key:       'greatAt' as keyof OnboardingValues,
    title:     'Something I\'m Great At',
    prompt:    'What is one honest thing you are genuinely great at?',
    hint:      'A strength, owned with confidence and without apology. No hedging. This is not bragging — it is honesty.',
    multiline: true,
    rows:      3,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function JournalOnboardingOverlay({ onComplete, onSkip }: Props) {
  const [phase, setPhase]   = useState<'offer' | 'guide'>('offer')
  const [step,  setStep]    = useState(0)
  const [values, setValues] = useState<OnboardingValues>({ intention: '', grateful: '', greatAt: '' })

  const currentStep = STEPS[step]
  const isLast      = step === STEPS.length - 1

  function handleNext() {
    if (!currentStep) return
    if (isLast) {
      onComplete(values)
    } else {
      setStep(s => s + 1)
    }
  }

  function handleChange(val: string) {
    setValues(v => ({ ...v, [currentStep.key]: val }))
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  if (phase === 'offer') {
    return (
      <div className="ob-overlay" role="dialog" aria-modal="true" aria-label="Journal guidance offer">
        <div className="ob-card ob-card--offer">
          <div className="ob-offer-icon" aria-hidden="true">✦</div>
          <h1 className="ob-offer-title">Your first journal</h1>
          <p className="ob-offer-body">
            A Wolfman journal has three parts — an intention, a gratitude, and something you are genuinely great at.
            Would you like a guided walk through your first entry?
          </p>
          <div className="ob-offer-btns">
            <button
              type="button"
              className="ob-btn ob-btn--primary"
              onClick={() => setPhase('guide')}
            >
              Guide me through it
            </button>
            <button
              type="button"
              className="ob-btn ob-btn--ghost"
              onClick={onSkip}
            >
              Jump straight in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Guide phase
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="ob-overlay" role="dialog" aria-modal="true" aria-label={`Guided journal: step ${step + 1} of ${STEPS.length}`}>
      <div className="ob-card ob-card--guide">

        {/* Progress bar */}
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step counter */}
        <p className="ob-step-counter">{step + 1} / {STEPS.length}</p>

        {/* Section title */}
        <h2 className="ob-step-title">{currentStep.title}</h2>
        <p className="ob-step-prompt">{currentStep.prompt}</p>
        <p className="ob-step-hint">{currentStep.hint}</p>

        {/* Input */}
        <textarea
          className="ob-textarea"
          rows={currentStep.rows}
          value={values[currentStep.key]}
          onChange={e => handleChange(e.target.value)}
          placeholder="Write here…"
          autoFocus
        />

        {/* Navigation */}
        <div className="ob-nav">
          <div className="ob-nav-left">
            {step > 0 ? (
              <button type="button" className="ob-btn ob-btn--ghost" onClick={handleBack}>← Back</button>
            ) : (
              <button type="button" className="ob-btn ob-btn--ghost" onClick={onSkip}>Skip guide</button>
            )}
          </div>
          <button
            type="button"
            className="ob-btn ob-btn--primary"
            onClick={handleNext}
            disabled={!values[currentStep.key].trim()}
          >
            {isLast ? 'Open my journal →' : 'Next →'}
          </button>
        </div>

      </div>
    </div>
  )
}
