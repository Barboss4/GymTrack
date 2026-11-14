export const newId = (prefix = 'id') => `${prefix}-${crypto.randomUUID()}`
export const nowIso = () => new Date().toISOString()
