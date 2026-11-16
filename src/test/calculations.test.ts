import { describe, expect, it } from 'vitest'
import { calculateNewRecordTypes, calculateSessionVolume, calculateSetVolume, estimateOneRepMax, percentageChange, shouldSuggestLoadIncrease } from '../utils/calculations'
import { buildTempoPhases, normalizeTempoConfig } from '../utils/tempo'

describe('cálculos de treino', () => {
  it('calcula volume e ignora aquecimento ou série incompleta', () => {
    expect(calculateSetVolume(40, 10)).toBe(400)
    expect(calculateSessionVolume([
      { weight: 40, reps: 10, warmup: false, completed: true },
      { weight: 20, reps: 10, warmup: true, completed: true },
      { weight: 40, reps: 10, warmup: false, completed: false }
    ])).toBe(400)
  })
  it('calcula 1RM estimado pela fórmula de Epley', () => {
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2)
    expect(estimateOneRepMax(0, 10)).toBe(0)
  })
  it('sugere progressão dupla só com todas as séries no teto e RIR adequado', () => {
    const good = [1,2,3].map(() => ({ completed:true,warmup:false,reps:12,rir:2 }))
    expect(shouldSuggestLoadIncrease(good,3,12)).toBe(true)
    expect(shouldSuggestLoadIncrease([...good.slice(0,2),{...good[2],reps:11}],3,12)).toBe(false)
    expect(shouldSuggestLoadIncrease([...good.slice(0,2),{...good[2],rir:0}],3,12)).toBe(false)
  })
  it('calcula variação percentual', () => {
    expect(percentageChange(100, 110)).toBe(10)
    expect(percentageChange(0, 10)).toBeNull()
  })
  it('detecta novos recordes de carga e 1RM', () => {
    const records = calculateNewRecordTypes({weight:42,reps:10},[{weight:40,reps:10},{weight:42,reps:8}])
    expect(records.map(r=>r.type)).toEqual(['estimated1rm'])
    expect(calculateNewRecordTypes({weight:45,reps:10},[{weight:42,reps:12}]).map(r=>r.type)).toEqual(['weight','estimated1rm'])
  })
})

describe('guia de cadência', () => {
  it('monta as fases começando pela descida e ignora pausas zeradas', () => {
    const phases = buildTempoPhases({downSeconds:3,bottomPauseSeconds:0,upSeconds:1,topPauseSeconds:0,reps:10,startWith:'down'})
    expect(phases.map(phase => phase.label)).toEqual(['DESCER','SUBIR'])
    expect(phases.map(phase => phase.durationSeconds)).toEqual([3,1])
  })
  it('permite começar pela subida e limita valores inválidos', () => {
    const config = normalizeTempoConfig({downSeconds:99,bottomPauseSeconds:-2,upSeconds:0,topPauseSeconds:1,reps:80,startWith:'up'})
    expect(config).toMatchObject({downSeconds:10,bottomPauseSeconds:0,upSeconds:.5,reps:50,startWith:'up'})
    expect(buildTempoPhases(config).map(phase => phase.label)).toEqual(['SUBIR','PAUSA EM CIMA','DESCER'])
  })
})
