import type { PerformedSet } from '../types'

export const calculateSetVolume = (weight: number, reps: number, warmup = false) => warmup ? 0 : Math.max(0, weight) * Math.max(0, reps)

export function calculateSessionVolume(sets: Pick<PerformedSet, 'weight' | 'reps' | 'warmup' | 'completed'>[]) {
  return sets.filter(s => s.completed && !s.warmup).reduce((sum, s) => sum + calculateSetVolume(s.weight, s.reps), 0)
}

export function estimateOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps <= 0) return 0
  return weight * (1 + reps / 30)
}

export function percentageChange(initial?: number, current?: number) {
  if (initial == null || current == null || initial === 0) return null
  return ((current - initial) / initial) * 100
}

export function shouldSuggestLoadIncrease(sets: Pick<PerformedSet, 'completed' | 'warmup' | 'reps' | 'rir'>[], targetSets: number, maxReps: number) {
  const effective = sets.filter(s => s.completed && !s.warmup).slice(0, targetSets)
  return effective.length >= targetSets && effective.every(s => s.reps >= maxReps && (s.rir == null || (s.rir >= 1 && s.rir <= 3)))
}

export function formatVolume(value: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value) + ' kg'
}

export function durationMinutes(startedAt: string, finishedAt?: string, pausedMs = 0) {
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  return Math.max(0, Math.round((end - new Date(startedAt).getTime() - pausedMs) / 60000))
}

export function calculateNewRecordTypes(current: Pick<PerformedSet, 'weight' | 'reps'>, previous: Pick<PerformedSet, 'weight' | 'reps'>[]) {
  const records: { type: 'weight' | 'estimated1rm'; value: number }[] = []
  const currentOneRm = estimateOneRepMax(current.weight, current.reps)
  if (current.weight > Math.max(0, ...previous.map(set => set.weight))) records.push({ type: 'weight', value: current.weight })
  if (currentOneRm > Math.max(0, ...previous.map(set => estimateOneRepMax(set.weight, set.reps)))) records.push({ type: 'estimated1rm', value: currentOneRm })
  return records
}
