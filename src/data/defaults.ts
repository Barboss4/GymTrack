import type { Exercise, PlannedExercise, Setting, UserProfile, WorkoutDay, WorkoutProgram } from '../types'

const now = () => new Date().toISOString()
const stamp = <T extends object>(id: string, data: T) => ({ id, ...data, createdAt: now(), updatedAt: now() })

type ExerciseSeed = [string, string, string, number, number, number, number, ('reps' | 'isometric')?, Exercise['loadType']?]
const seeds: ExerciseSeed[] = [
  ['supino-reto', 'Supino reto com barra', 'Peito', 1, 3, 6, 10],
  ['supino-inclinado-halteres', 'Supino inclinado com halteres', 'Peito', 2.5, 3, 8, 12],
  ['desenvolvimento-halteres', 'Desenvolvimento com halteres', 'Ombros', 2, 2, 8, 12],
  ['elevacao-lateral', 'Elevação lateral', 'Ombros', 1, 3, 12, 20],
  ['triceps-polia', 'Tríceps na polia', 'Tríceps', 2, 3, 10, 15],
  ['triceps-testa-polia', 'Tríceps testa na polia', 'Tríceps', 1, 2, 10, 15],
  ['puxada-alta', 'Puxada alta na frente', 'Costas', 2, 3, 8, 12],
  ['remada-baixa', 'Remada baixa', 'Costas', 2, 3, 8, 12],
  ['remada-unilateral', 'Remada unilateral com halter', 'Costas', 2, 2, 10, 12],
  ['crucifixo-inverso', 'Crucifixo inverso', 'Ombros', 1, 3, 12, 20],
  ['rosca-direta', 'Rosca direta', 'Bíceps', 1, 3, 8, 12],
  ['rosca-martelo', 'Rosca martelo', 'Bíceps', 1, 2, 10, 15],
  ['rosca-inclinada-halteres', 'Rosca inclinada com halteres', 'Bíceps', 1, 2, 10, 15],
  ['rosca-inversa-barra', 'Rosca inversa com barra', 'Antebraços', 1, 2, 12, 15],
  ['agachamento-livre', 'Agachamento livre ou Smith', 'Quadríceps', 2.5, 3, 6, 10],
  ['leg-press', 'Leg press 45°', 'Quadríceps', 5, 3, 10, 15],
  ['cadeira-extensora', 'Cadeira extensora', 'Quadríceps', 2, 2, 12, 15],
  ['mesa-flexora', 'Mesa flexora', 'Posterior', 2, 3, 10, 15],
  ['panturrilha-pe', 'Panturrilha em pé', 'Panturrilhas', 2, 4, 10, 15],
  ['abdominal-polia', 'Abdominal na polia', 'Abdômen', 1, 3, 10, 15],
  ['abdominal-supra-solo', 'Abdominal supra no solo', 'Abdômen', 0, 2, 15, 20],
  ['elevacao-pernas', 'Elevação de pernas', 'Abdômen', 0, 2, 10, 15],
  ['supino-maquina', 'Supino inclinado na máquina', 'Peito', 2, 3, 8, 12],
  ['puxada-neutra', 'Puxada neutra', 'Costas', 2, 3, 8, 12],
  ['remada-articulada', 'Remada articulada', 'Costas', 2, 3, 8, 12],
  ['crucifixo-cabo', 'Crucifixo no cabo', 'Peito', 1, 2, 12, 15],
  ['rosca-scott', 'Rosca Scott', 'Bíceps', 1, 2, 10, 15],
  ['triceps-frances', 'Tríceps francês na polia', 'Tríceps', 1, 2, 10, 15],
  ['desenvolvimento-maquina', 'Desenvolvimento na máquina', 'Ombros', 2, 2, 8, 12],
  ['extensao-punho-halteres', 'Extensão de punho com halteres', 'Antebraços', 1, 2, 15, 20],
  ['abdominal-bicicleta', 'Abdominal bicicleta', 'Abdômen', 0, 2, 15, 20],
  ['terra-romeno', 'Levantamento terra romeno', 'Posterior', 2.5, 3, 8, 10],
  ['extensao-quadril-cabo', 'Extensão de quadril no cabo', 'Glúteos', 1, 3, 12, 15],
  ['agachamento-hack', 'Agachamento hack ou Smith', 'Quadríceps', 2.5, 3, 8, 12],
  ['cadeira-flexora', 'Cadeira flexora', 'Posterior', 2, 3, 10, 15],
  ['elevacao-pelvica', 'Elevação pélvica', 'Glúteos', 2.5, 3, 8, 12],
  ['panturrilha-sentada', 'Panturrilha sentada', 'Panturrilhas', 2, 3, 12, 20],
  ['prancha', 'Prancha abdominal', 'Abdômen', 0, 3, 30, 60, 'isometric'],
  ['bird-dog', 'Bird-dog (cada lado)', 'Lombar e core', 0, 2, 6, 8, 'reps', 'bodyweight'],
  ['face-pull', 'Face pull na polia', 'Meio das costas', 1, 2, 12, 20]
]

const rest: Record<string, number> = {
  'supino-reto': 150, 'agachamento-livre': 180, 'terra-romeno': 180, 'abdominal-polia': 60,
  'abdominal-supra-solo': 60, 'elevacao-pernas': 60, 'abdominal-bicicleta': 60, 'prancha': 60,
  'bird-dog': 45, 'face-pull': 60
}

export const defaultExercises: Exercise[] = seeds.map(([id, name, muscleGroup, loadIncrement, , , , mode, loadType]) => stamp(id, {
  name, muscleGroup, secondaryGroups: [], mode: mode || 'reps',
  loadIncrement, loadType: loadType || (name.includes('halter') ? 'per_dumbbell' as const : 'total' as const)
}))

export const defaultProfile: UserProfile = stamp('profile', {
  sex: 'masculino' as const, heightCm: 190, initialWeightKg: 85, visceralFatIndicator: 7,
  visceralFatScale: 'não especificada', primaryGoal: 'Ganhar massa muscular no corpo inteiro',
  secondaryGoal: 'Reduzir gordura abdominal', strengthDaysPerWeek: 5,
  cardioType: 'Bicicleta ergométrica em casa', strategy: 'Recomposição corporal'
})

export const defaultProgram: WorkoutProgram = stamp('programa-principal', { name: 'Programa principal', active: true, notes: 'Séries efetivas com 1–3 RIR e execução técnica.' })

const daySeeds = [
  ['push-a', 'PUSH A', 1, 'Peito, ombros, tríceps, abdômen e estabilização lombar', ['supino-reto','supino-inclinado-halteres','crucifixo-cabo','desenvolvimento-halteres','elevacao-lateral','triceps-polia','triceps-testa-polia','bird-dog','abdominal-supra-solo']],
  ['pull-a', 'PULL A', 2, 'Costas, meio das costas, bíceps, antebraços e abdômen', ['puxada-alta','remada-baixa','remada-unilateral','crucifixo-inverso','rosca-direta','rosca-martelo','rosca-inclinada-halteres','rosca-inversa-barra','face-pull','elevacao-pernas']],
  ['legs-a', 'LEGS A', 3, 'Quadríceps, posterior, panturrilhas, abdômen e estabilização lombar', ['agachamento-livre','leg-press','cadeira-extensora','mesa-flexora','panturrilha-pe','bird-dog','abdominal-polia']],
  ['upper-b', 'UPPER B', 4, 'Parte superior completa, meio das costas, braços, antebraços e abdômen', ['supino-maquina','puxada-neutra','remada-articulada','crucifixo-cabo','elevacao-lateral','rosca-scott','triceps-frances','desenvolvimento-maquina','extensao-punho-halteres','face-pull','abdominal-bicicleta']],
  ['lower-b', 'LOWER B', 5, 'Posterior, glúteos, quadríceps, panturrilhas, abdômen e estabilização lombar', ['extensao-quadril-cabo','agachamento-hack','cadeira-flexora','elevacao-pelvica','panturrilha-sentada','bird-dog','prancha']]
] as const

export const defaultWorkoutDays: WorkoutDay[] = daySeeds.map(([id, name, weekday, focus], order) => stamp(id, { programId: defaultProgram.id, name, weekday, focus, order }))

export const defaultPlannedExercises: PlannedExercise[] = daySeeds.flatMap(([dayId,,, , exerciseIds]) => exerciseIds.map((exerciseId, order) => {
  const seed = seeds.find(s => s[0] === exerciseId)!
  const defaultRest = seed[5] <= 10 ? 120 : 90
  return stamp(`${dayId}-${exerciseId}`, { workoutDayId: dayId, exerciseId, order, sets: seed[4], minReps: seed[5], maxReps: seed[6], restSeconds: rest[exerciseId] || defaultRest })
}))

export const v3ExerciseIds = ['triceps-testa-polia','rosca-inclinada-halteres','rosca-inversa-barra','desenvolvimento-maquina','extensao-punho-halteres'] as const
export const v3Exercises = defaultExercises.filter(exercise => (v3ExerciseIds as readonly string[]).includes(exercise.id))
export const v3PlannedExercises = defaultPlannedExercises.filter(planned => (v3ExerciseIds as readonly string[]).includes(planned.exerciseId))

export const v4ExerciseIds = ['abdominal-supra-solo','elevacao-pernas','abdominal-bicicleta'] as const
export const v4Exercises = defaultExercises.filter(exercise => (v4ExerciseIds as readonly string[]).includes(exercise.id))
export const v4PlannedExercises = defaultPlannedExercises.filter(planned => (v4ExerciseIds as readonly string[]).includes(planned.exerciseId))

export const v5ExerciseIds = ['extensao-quadril-cabo'] as const
export const v5Exercises = defaultExercises.filter(exercise => (v5ExerciseIds as readonly string[]).includes(exercise.id))
export const v5PlannedExercises = defaultPlannedExercises.filter(planned => (v5ExerciseIds as readonly string[]).includes(planned.exerciseId))

export const v6PlannedExercises = defaultPlannedExercises.filter(planned => planned.id === 'push-a-crucifixo-cabo')

export const v7ExerciseIds = ['bird-dog','face-pull'] as const
export const v7Exercises = defaultExercises.filter(exercise => (v7ExerciseIds as readonly string[]).includes(exercise.id))
export const v7PlannedExercises = defaultPlannedExercises.filter(planned => (v7ExerciseIds as readonly string[]).includes(planned.exerciseId))

export const defaultSettings: Setting[] = [
  stamp('setting-cardio-goal', { key: 'cardioWeeklyGoalMinutes', value: 75 }),
  stamp('setting-cardio-plan', { key: 'cardioPlan', value: [{ weekday: 2, minutes: 20 }, { weekday: 4, minutes: 20 }, { weekday: 6, minutes: 35 }] }),
  stamp('setting-supplements', { key: 'supplementItems', value: ['Creatina monohidratada', 'Pré-treino', 'Durateston (testosterona)'] }),
  stamp('setting-measurement-goals', { key: 'measurementGoals', value: {} })
]
