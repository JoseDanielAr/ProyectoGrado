import { getDb, initDb } from '@/lib/db/database'

const ACTIVE_USER_ID = 1
const ESTADO_NO_COMPLETADO = 1

/**
 * Pone todos los EstadoID de progreso del usuario en "no completado" (1).
 * Tablas: UsuarioModulo, UsuarioClase, UsuarioQuiz.
 */
export async function resetAllEstadoIdToNotCompleted() {
  await initDb()
  const db = await getDb()

  await db.runAsync('UPDATE UsuarioModulo SET EstadoID = ?;', [ESTADO_NO_COMPLETADO])
  await db.runAsync('UPDATE UsuarioClase SET EstadoID = ?;', [ESTADO_NO_COMPLETADO])
  await db.runAsync('UPDATE UsuarioQuiz SET EstadoID = ?;', [ESTADO_NO_COMPLETADO])
  await db.runAsync('UPDATE Usuario SET Puntaje = 0 WHERE UsuarioID = ?;', [ACTIVE_USER_ID])
}
