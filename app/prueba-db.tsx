import { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { addUsuarioPuntajeDelta, getActiveUsuario, getAllUsuarios, type UsuarioRow } from '@/lib/db/usuario-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

interface ActionButtonProps {
  label: string
  onPress: () => void
}

function ActionButton({ label, onPress }: ActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export default function PruebasDbScreen() {
  const [puntaje, setPuntaje] = useState<number | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])

  const refresh = useCallback(async () => {
    const [usuario, usuariosRows] = await Promise.all([getActiveUsuario(), getAllUsuarios()])
    setPuntaje(usuario.Puntaje)
    setUsuarios(usuariosRows)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function applyDelta(delta: number) {
    const updated = await addUsuarioPuntajeDelta({ delta })
    setPuntaje(updated.Puntaje)
    const usuariosRows = await getAllUsuarios()
    setUsuarios(usuariosRows)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Pruebas DB</Text>
        <Text style={styles.subtitle}>Puntaje actual: {puntaje ?? '...'}</Text>
        <View style={styles.separator} />

        <View style={styles.buttonList}>
          <ActionButton label="+100" onPress={() => void applyDelta(100)} />
          <ActionButton label="-100" onPress={() => void applyDelta(-100)} />
        </View>

        <View style={styles.separatorAfterButtons} />

        <Text style={styles.tableTitle}>Tabla Usuario</Text>
        <View style={styles.rowsContainer}>
          {usuarios.map(usuario => (
            <View key={usuario.UsuarioID} style={styles.rowCard}>
              <Text style={styles.rowText}>UsuarioID: {usuario.UsuarioID}</Text>
              <Text style={styles.rowText}>Racha: {usuario.Racha}</Text>
              <Text style={styles.rowText}>Puntaje: {usuario.Puntaje}</Text>
              <Text style={styles.rowText}>ConfMusica: {usuario.ConfMusica}</Text>
              <Text style={styles.rowText}>ConfSFX: {usuario.ConfSFX}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: WHITE,
  },
  title: {
    color: BLUE,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    marginTop: 8,
  },
  separator: {
    width: '100%',
    height: 1,
    marginTop: 14,
    backgroundColor: '#D9D9D9',
  },
  buttonList: {
    marginTop: 18,
    gap: 10,
  },
  separatorAfterButtons: {
    width: '100%',
    height: 1,
    marginTop: 18,
    backgroundColor: '#D9D9D9',
  },
  tableTitle: {
    color: BLUE_SECONDARY,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  rowsContainer: {
    marginTop: 10,
    gap: 10,
  },
  rowCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    padding: 12,
    backgroundColor: WHITE,
  },
  rowText: {
    color: BLUE_SECONDARY,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  button: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})

