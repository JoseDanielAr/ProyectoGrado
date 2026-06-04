import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { completeClaseForActiveUser } from '@/lib/db/modulo-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

const VALID_CLASE_IDS = new Set([9, 10, 11, 12])

const CLASE_LABELS: Record<number, string> = {
  9: 'Clase 9',
  10: 'Clase 10',
  11: 'Clase 11',
  12: 'Clase 12',
}

function parseClaseId(raw: string | string[] | undefined): number | null {
  if (raw === undefined) return null
  const value = Array.isArray(raw) ? raw[0] : raw
  const n = Number(value)
  if (!Number.isFinite(n) || !VALID_CLASE_IDS.has(n)) return null
  return n
}

export default function ModuloTresClaseScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ claseId?: string | string[] }>()
  const claseId = useMemo(() => parseClaseId(params.claseId), [params.claseId])
  const [isBusy, setIsBusy] = useState(false)

  const title = claseId != null ? CLASE_LABELS[claseId] ?? `Clase ${claseId}` : 'Clase'

  const handleComplete = useCallback(async () => {
    if (claseId == null || isBusy) return
    setIsBusy(true)
    try {
      await completeClaseForActiveUser({ claseId })
      router.back()
    } catch (error) {
      console.warn('No se pudo completar la clase del modulo 3.', error)
    } finally {
      setIsBusy(false)
    }
  }, [claseId, isBusy, router])

  if (claseId == null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Clase no válida.</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}>
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Pantalla de prueba: al completar se actualiza UsuarioClase, el puntaje del usuario y el estado del módulo
          cuando corresponda.
        </Text>
        <Pressable
          onPress={() => void handleComplete()}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Completar clase y volver al modulo"
          style={({ pressed }) => [
            styles.primaryButton,
            (isBusy || pressed) && styles.buttonPressed,
            isBusy && styles.primaryButtonDisabled,
          ]}>
          {isBusy ? (
            <ActivityIndicator color={WHITE} />
          ) : (
            <Text style={styles.primaryButtonText}>Completar clase</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          disabled={isBusy}
          accessibilityRole="button"
          style={({ pressed }) => [styles.secondaryButton, pressed && !isBusy && styles.buttonPressed]}>
          <Text style={styles.secondaryButtonText}>Volver sin completar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  centered: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: BLUE,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 12,
    color: BLUE_SECONDARY,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 24,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
})
