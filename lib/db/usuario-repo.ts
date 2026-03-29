import { getDb, initDb } from '@/lib/db/database'

const ACTIVE_USER_ID = 1

export interface UsuarioRow {
  UsuarioID: number
  Racha: number
  Puntaje: number
  ConfMusica: number
  ConfSFX: number
}

export async function getActiveUsuario() {
  await initDb()
  const db = await getDb()

  const row = await db.getFirstAsync<UsuarioRow>(
    'SELECT UsuarioID, Racha, Puntaje, ConfMusica, ConfSFX FROM Usuario WHERE UsuarioID = ?;',
    [ACTIVE_USER_ID]
  )

  if (row) return row

  // Failsafe: si por alguna razón no existe el usuario base, lo creamos.
  await db.runAsync(
    'INSERT INTO Usuario (UsuarioID, Racha, Puntaje, ConfMusica, ConfSFX) VALUES (?, 0, 0, 0, 0);',
    [ACTIVE_USER_ID]
  )

  const created = await db.getFirstAsync<UsuarioRow>(
    'SELECT UsuarioID, Racha, Puntaje, ConfMusica, ConfSFX FROM Usuario WHERE UsuarioID = ?;',
    [ACTIVE_USER_ID]
  )

  if (!created) throw new Error('No se pudo crear el usuario base.')
  return created
}

export async function addUsuarioPuntajeDelta({ delta }: { delta: number }) {
  await initDb()
  const db = await getDb()

  await db.runAsync('UPDATE Usuario SET Puntaje = Puntaje + ? WHERE UsuarioID = ?;', [
    delta,
    ACTIVE_USER_ID,
  ])

  return await getActiveUsuario()
}

export async function getAllUsuarios() {
  await initDb()
  const db = await getDb()

  return await db.getAllAsync<UsuarioRow>(
    'SELECT UsuarioID, Racha, Puntaje, ConfMusica, ConfSFX FROM Usuario ORDER BY UsuarioID ASC;'
  )
}

export async function updateActiveUsuarioAudioConfig({
  confMusica,
  confSfx,
}: {
  confMusica: number
  confSfx: number
}) {
  await initDb()
  const db = await getDb()

  const music = Math.max(0, Math.min(1, confMusica))
  const sfx = Math.max(0, Math.min(1, confSfx))

  await db.runAsync('UPDATE Usuario SET ConfMusica = ?, ConfSFX = ? WHERE UsuarioID = ?;', [
    music,
    sfx,
    ACTIVE_USER_ID,
  ])

  return await getActiveUsuario()
}

