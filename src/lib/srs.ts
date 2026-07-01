export interface SrsState { easeFactor: number; interval: number; repetitions: number }
export interface SrsResult extends SrsState { nextReview: Date }

export function applyReview(state: SrsState, quality: number): SrsResult {
  let ef = state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (ef < 1.3) ef = 1.3

  let repetitions: number, interval: number, nextReview: Date
  if (quality < 3) {
    repetitions = 0
    interval = 0
    nextReview = new Date(Date.now() + 60_000)
  } else {
    repetitions = state.repetitions + 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(state.interval * ef)
    nextReview = new Date(Date.now() + interval * 86_400_000)
  }
  return { easeFactor: ef, interval, repetitions, nextReview }
}
