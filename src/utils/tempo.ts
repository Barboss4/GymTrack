export type TempoDirection = 'down' | 'up'
export type TempoPhaseKey = 'down' | 'bottom' | 'up' | 'top'

export interface TempoConfig {
  downSeconds: number
  bottomPauseSeconds: number
  upSeconds: number
  topPauseSeconds: number
  reps: number
  startWith: TempoDirection
}

export interface TempoPhase {
  key: TempoPhaseKey
  label: string
  durationSeconds: number
  frequency: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))

export function normalizeTempoConfig(config: TempoConfig): TempoConfig {
  return {
    downSeconds: clamp(config.downSeconds, 0.5, 10),
    bottomPauseSeconds: clamp(config.bottomPauseSeconds, 0, 10),
    upSeconds: clamp(config.upSeconds, 0.5, 10),
    topPauseSeconds: clamp(config.topPauseSeconds, 0, 10),
    reps: Math.round(clamp(config.reps, 1, 50)),
    startWith: config.startWith === 'up' ? 'up' : 'down'
  }
}

export function buildTempoPhases(input: TempoConfig): TempoPhase[] {
  const config = normalizeTempoConfig(input)
  const down: TempoPhase = { key: 'down', label: 'DESCER', durationSeconds: config.downSeconds, frequency: 440 }
  const bottom: TempoPhase = { key: 'bottom', label: 'PAUSA EMBAIXO', durationSeconds: config.bottomPauseSeconds, frequency: 620 }
  const up: TempoPhase = { key: 'up', label: 'SUBIR', durationSeconds: config.upSeconds, frequency: 880 }
  const top: TempoPhase = { key: 'top', label: 'PAUSA EM CIMA', durationSeconds: config.topPauseSeconds, frequency: 620 }
  const ordered = config.startWith === 'up' ? [up, top, down, bottom] : [down, bottom, up, top]
  return ordered.filter(phase => phase.durationSeconds > 0)
}
