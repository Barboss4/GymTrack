import { describe, expect, it } from 'vitest'
import { DB_VERSION, allTableNames } from '../db'
import { toCsv, validateBackup } from '../utils/export'

describe('exportação e importação',()=>{
  it('gera CSV escapando vírgulas e aspas',()=>{const csv=toCsv([{nome:'Supino, reto',nota:'Disse "ok"'}]);expect(csv).toContain('"Supino, reto"');expect(csv).toContain('"Disse ""ok"""')})
  it('valida estrutura e versão do backup',()=>{const data=Object.fromEntries(allTableNames.map(name=>[name,[]]));expect(validateBackup({app:'GymTrack',version:DB_VERSION,exportedAt:now(),data})).toBe(true);expect(validateBackup({app:'Outro',version:DB_VERSION,data})).toBe(false);expect(validateBackup({app:'GymTrack',version:DB_VERSION+1,data})).toBe(false)})
})
const now=()=>new Date().toISOString()
