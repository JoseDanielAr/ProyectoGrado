import type { RepasoQuestion } from '@/lib/repaso/repaso-repo'

const COOLDOWN_SIZE = 5

export function pickNextRepasoQuestion({
  pool,
  recentKeys,
}: {
  pool: RepasoQuestion[]
  recentKeys: string[]
}): { question: RepasoQuestion; nextRecentKeys: string[] } {
  if (!pool.length) throw new Error('El pool de repaso está vacío.')

  const forbidden = new Set(recentKeys)
  let eligible = pool.filter(question => !forbidden.has(question.key))

  if (!eligible.length) {
    const lastKey = recentKeys[recentKeys.length - 1]
    eligible = pool.filter(question => question.key !== lastKey)
  }

  if (!eligible.length) eligible = pool

  const question = eligible[Math.floor(Math.random() * eligible.length)]!
  const nextRecentKeys = [...recentKeys, question.key]
  if (nextRecentKeys.length > COOLDOWN_SIZE) nextRecentKeys.shift()

  return { question, nextRecentKeys }
}
