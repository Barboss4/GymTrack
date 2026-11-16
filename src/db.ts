import Dexie, { type EntityTable } from 'dexie'
import type { BodyMeasurement, CardioSession, Exercise, HealthLog, LabResult, PerformedSet, PersonalRecord, PlannedExercise, Setting, SupplementLog, UserProfile, WorkoutDay, WorkoutProgram, WorkoutSession } from './types'
import { defaultExercises, defaultPlannedExercises, defaultProfile, defaultProgram, defaultSettings, defaultWorkoutDays, v3Exercises, v3PlannedExercises, v4Exercises, v4PlannedExercises, v5Exercises, v5PlannedExercises } from './data/defaults'

export const DB_VERSION = 5

export class GymTrackDatabase extends Dexie {
  userProfile!: EntityTable<UserProfile, 'id'>
  exercises!: EntityTable<Exercise, 'id'>
  workoutPrograms!: EntityTable<WorkoutProgram, 'id'>
  workoutDays!: EntityTable<WorkoutDay, 'id'>
  plannedExercises!: EntityTable<PlannedExercise, 'id'>
  workoutSessions!: EntityTable<WorkoutSession, 'id'>
  performedSets!: EntityTable<PerformedSet, 'id'>
  bodyMeasurements!: EntityTable<BodyMeasurement, 'id'>
  cardioSessions!: EntityTable<CardioSession, 'id'>
  supplementLogs!: EntityTable<SupplementLog, 'id'>
  healthLogs!: EntityTable<HealthLog, 'id'>
  labResults!: EntityTable<LabResult, 'id'>
  personalRecords!: EntityTable<PersonalRecord, 'id'>
  settings!: EntityTable<Setting, 'id'>

  constructor(name = 'gymtrack') {
    super(name)
    this.version(1).stores({
      userProfile: 'id', exercises: 'id, name, muscleGroup', workoutPrograms: 'id, active',
      workoutDays: 'id, programId, weekday, order', plannedExercises: 'id, workoutDayId, exerciseId, order',
      workoutSessions: 'id, workoutDayId, startedAt, status', performedSets: 'id, sessionId, exerciseId, [sessionId+exerciseId], completedAt',
      bodyMeasurements: 'id, date', cardioSessions: 'id, date', supplementLogs: 'id, date, name',
      healthLogs: 'id, date', labResults: 'id, date, name', personalRecords: 'id, exerciseId, sessionId, type, achievedAt', settings: 'id, &key'
    })
    this.version(2).stores({
      userProfile: 'id', exercises: 'id, name, muscleGroup, archived', workoutPrograms: 'id, active',
      workoutDays: 'id, programId, weekday, order', plannedExercises: 'id, workoutDayId, exerciseId, order',
      workoutSessions: 'id, workoutDayId, startedAt, finishedAt, status', performedSets: 'id, sessionId, exerciseId, [sessionId+exerciseId], completedAt, warmup',
      bodyMeasurements: 'id, date', cardioSessions: 'id, date', supplementLogs: 'id, date, name',
      healthLogs: 'id, date', labResults: 'id, date, name', personalRecords: 'id, exerciseId, sessionId, type, achievedAt', settings: 'id, &key'
    }).upgrade(async tx => {
      await tx.table('workoutSessions').toCollection().modify(session => { if (session.totalPausedMs == null) session.totalPausedMs = 0 })
      await tx.table('performedSets').toCollection().modify(set => { if (set.warmup == null) set.warmup = false })
    })
    this.version(3).stores({
      userProfile: 'id', exercises: 'id, name, muscleGroup, archived', workoutPrograms: 'id, active',
      workoutDays: 'id, programId, weekday, order', plannedExercises: 'id, workoutDayId, exerciseId, order',
      workoutSessions: 'id, workoutDayId, startedAt, finishedAt, status', performedSets: 'id, sessionId, exerciseId, [sessionId+exerciseId], completedAt, warmup',
      bodyMeasurements: 'id, date', cardioSessions: 'id, date', supplementLogs: 'id, date, name',
      healthLogs: 'id, date', labResults: 'id, date, name', personalRecords: 'id, exerciseId, sessionId, type, achievedAt', settings: 'id, &key'
    }).upgrade(async tx => {
      const exercises = tx.table('exercises')
      const plannedExercises = tx.table('plannedExercises')
      for (const exercise of v3Exercises) if (!await exercises.get(exercise.id)) await exercises.add(exercise)
      for (const planned of v3PlannedExercises) if (!await plannedExercises.get(planned.id)) await plannedExercises.add(planned)
    })
    this.version(4).stores({
      userProfile: 'id', exercises: 'id, name, muscleGroup, archived', workoutPrograms: 'id, active',
      workoutDays: 'id, programId, weekday, order', plannedExercises: 'id, workoutDayId, exerciseId, order',
      workoutSessions: 'id, workoutDayId, startedAt, finishedAt, status', performedSets: 'id, sessionId, exerciseId, [sessionId+exerciseId], completedAt, warmup',
      bodyMeasurements: 'id, date', cardioSessions: 'id, date', supplementLogs: 'id, date, name',
      healthLogs: 'id, date', labResults: 'id, date, name', personalRecords: 'id, exerciseId, sessionId, type, achievedAt', settings: 'id, &key'
    }).upgrade(async tx => {
      const exercises = tx.table('exercises')
      const plannedExercises = tx.table('plannedExercises')
      for (const exercise of v4Exercises) if (!await exercises.get(exercise.id)) await exercises.add(exercise)
      for (const planned of v4PlannedExercises) if (!await plannedExercises.get(planned.id)) await plannedExercises.add(planned)
    })
    this.version(5).stores({
      userProfile: 'id', exercises: 'id, name, muscleGroup, archived', workoutPrograms: 'id, active',
      workoutDays: 'id, programId, weekday, order', plannedExercises: 'id, workoutDayId, exerciseId, order',
      workoutSessions: 'id, workoutDayId, startedAt, finishedAt, status', performedSets: 'id, sessionId, exerciseId, [sessionId+exerciseId], completedAt, warmup',
      bodyMeasurements: 'id, date', cardioSessions: 'id, date', supplementLogs: 'id, date, name',
      healthLogs: 'id, date', labResults: 'id, date, name', personalRecords: 'id, exerciseId, sessionId, type, achievedAt', settings: 'id, &key'
    }).upgrade(async tx => {
      const exercises = tx.table('exercises')
      const plannedExercises = tx.table('plannedExercises')
      for (const exercise of v5Exercises) if (!await exercises.get(exercise.id)) await exercises.add(exercise)
      const previous = await plannedExercises.get('lower-b-terra-romeno')
      if (previous?.exerciseId === 'terra-romeno') {
        await plannedExercises.delete(previous.id)
        for (const planned of v5PlannedExercises) if (!await plannedExercises.get(planned.id)) await plannedExercises.add(planned)
      }
    })
  }
}

export const db = new GymTrackDatabase()

export async function initializeDatabase(database = db) {
  await database.open()
  if (await database.userProfile.count()) return
  await database.transaction('rw', [database.userProfile, database.exercises, database.workoutPrograms, database.workoutDays, database.plannedExercises, database.settings], async () => {
    await database.userProfile.put(defaultProfile)
    await database.exercises.bulkPut(defaultExercises)
    await database.workoutPrograms.put(defaultProgram)
    await database.workoutDays.bulkPut(defaultWorkoutDays)
    await database.plannedExercises.bulkPut(defaultPlannedExercises)
    await database.settings.bulkPut(defaultSettings)
  })
}

export const allTableNames = ['userProfile','exercises','workoutPrograms','workoutDays','plannedExercises','workoutSessions','performedSets','bodyMeasurements','cardioSessions','supplementLogs','healthLogs','labResults','personalRecords','settings'] as const
