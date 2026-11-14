import { DB_VERSION, GymTrackDatabase, allTableNames, db } from '../db'
import type { BackupPayload } from '../types'

export function downloadFile(content: string, filename: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function createBackup(database: GymTrackDatabase = db): Promise<BackupPayload> {
  const data: Record<string, unknown[]> = {}
  for (const name of allTableNames) data[name] = await database.table(name).toArray()
  return { app: 'GymTrack', version: DB_VERSION, exportedAt: new Date().toISOString(), data }
}

export async function exportBackup() {
  const payload = await createBackup()
  downloadFile(JSON.stringify(payload, null, 2), `gymtrack-backup-${payload.exportedAt.slice(0,10)}.json`, 'application/json')
}

export function validateBackup(value: unknown): value is BackupPayload {
  if (!value || typeof value !== 'object') return false
  const candidate = value as BackupPayload
  return candidate.app === 'GymTrack' && typeof candidate.version === 'number' && candidate.version <= DB_VERSION && !!candidate.data && allTableNames.every(name => Array.isArray(candidate.data[name]))
}

export async function importBackup(value: unknown, database: GymTrackDatabase = db) {
  if (!validateBackup(value)) throw new Error('Backup inválido ou de uma versão incompatível.')
  await database.transaction('rw', database.tables, async () => {
    for (const name of [...allTableNames].reverse()) await database.table(name).clear()
    for (const name of allTableNames) if (value.data[name].length) await database.table(name).bulkPut(value.data[name])
  })
}

const escapeCsv = (value: unknown) => `"${String(value ?? '').replaceAll('"','""')}"`
export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = [...new Set(rows.flatMap(row => Object.keys(row)))]
  return [headers.map(escapeCsv).join(','), ...rows.map(row => headers.map(h => escapeCsv(row[h])).join(','))].join('\r\n')
}

export async function exportTableCsv(table: typeof allTableNames[number], filename: string) {
  const rows = await db.table(table).toArray() as Record<string, unknown>[]
  downloadFile('\ufeff' + toCsv(rows), filename, 'text/csv;charset=utf-8')
}

export async function exportWorkoutsCsv() {
  const [sessions, sets] = await Promise.all([db.workoutSessions.toArray(), db.performedSets.toArray()])
  const sessionMap = new Map(sessions.map(s=>[s.id,s]))
  const rows = sets.map(set => { const session=sessionMap.get(set.sessionId); return { data: session?.startedAt, treino:session?.workoutName, exercicio:set.exerciseName, serie:set.setOrder, aquecimento:set.warmup?'sim':'não', pesoKg:set.weight, repeticoes:set.reps, duracaoSegundos:set.durationSeconds, rir:set.rir, concluida:set.completed?'sim':'não' } })
  downloadFile('\ufeff'+toCsv(rows),`gymtrack-treinos-${new Date().toISOString().slice(0,10)}.csv`,'text/csv;charset=utf-8')
}
