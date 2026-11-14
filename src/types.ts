export type ID = string

export interface Timestamped { id: ID; createdAt: string; updatedAt: string }

export interface UserProfile extends Timestamped {
  sex: 'masculino' | 'feminino' | 'outro'
  heightCm: number
  initialWeightKg: number
  visceralFatIndicator?: number
  visceralFatScale?: string
  primaryGoal: string
  secondaryGoal: string
  strengthDaysPerWeek: number
  cardioType: string
  strategy: string
}

export type ExerciseMode = 'reps' | 'isometric'
export interface Exercise extends Timestamped {
  name: string
  muscleGroup: string
  secondaryGroups: string[]
  mode: ExerciseMode
  equipment?: string
  loadIncrement: number
  loadType: 'total' | 'per_dumbbell' | 'bodyweight' | 'assistance'
  archived?: boolean
}

export interface WorkoutProgram extends Timestamped { name: string; active: boolean; notes?: string }
export interface WorkoutDay extends Timestamped { programId: ID; name: string; weekday: number; focus: string; order: number }
export interface PlannedExercise extends Timestamped {
  workoutDayId: ID
  exerciseId: ID
  order: number
  sets: number
  minReps: number
  maxReps: number
  restSeconds: number
  notes?: string
}

export interface WorkoutSession extends Timestamped {
  workoutDayId: ID
  workoutName: string
  focus: string
  startedAt: string
  finishedAt?: string
  status: 'active' | 'paused' | 'completed'
  pausedAt?: string
  totalPausedMs: number
  notes?: string
}

export interface PerformedSet extends Timestamped {
  sessionId: ID
  plannedExerciseId?: ID
  exerciseId: ID
  exerciseName: string
  exerciseOrder: number
  setOrder: number
  weight: number
  reps: number
  durationSeconds?: number
  rir?: number
  completed: boolean
  warmup: boolean
  completedAt?: string
}

export interface BodyMeasurement extends Timestamped {
  date: string
  weightKg?: number
  waistCm?: number
  abdomenCm?: number
  chestCm?: number
  rightArmCm?: number
  leftArmCm?: number
  rightForearmCm?: number
  leftForearmCm?: number
  rightThighCm?: number
  leftThighCm?: number
  rightCalfCm?: number
  leftCalfCm?: number
  hipsCm?: number
  notes?: string
}

export interface CardioSession extends Timestamped {
  date: string
  durationMinutes: number
  distanceKm?: number
  resistance?: string
  averageHeartRate?: number
  maxHeartRate?: number
  perceivedEffort?: number
  notes?: string
}

export interface SupplementLog extends Timestamped {
  name: string
  date: string
  time?: string
  amount?: number
  unit?: string
  route?: string
  caffeineMg?: number
  notes?: string
  adverseReactions?: string
}

export interface HealthLog extends Timestamped {
  date: string
  sleepHours?: number
  sleepQuality?: number
  fatigue?: number
  muscleSoreness?: number
  jointPain?: string
  systolic?: number
  diastolic?: number
  restingHeartRate?: number
  notes?: string
}

export interface LabResult extends Timestamped { name: string; date: string; result: string; unit?: string; referenceRange?: string; notes?: string }
export interface PersonalRecord extends Timestamped { exerciseId: ID; sessionId: ID; type: 'weight' | 'volume' | 'estimated1rm'; value: number; achievedAt: string }
export interface Setting extends Timestamped { key: string; value: unknown }

export interface BackupPayload {
  app: 'GymTrack'
  version: number
  exportedAt: string
  data: Record<string, unknown[]>
}
