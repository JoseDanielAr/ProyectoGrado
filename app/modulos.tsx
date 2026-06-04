import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getFirstAvailableModuloId, isModuloUnlocked } from '@/lib/db/modulo-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

export default function ModulosScreen() {
  const router = useRouter()
  const [firstAvailableModuloId, setFirstAvailableModuloId] = useState<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      async function loadProgress() {
        try {
          const moduloId = await getFirstAvailableModuloId()
          if (!isActive) return
          setFirstAvailableModuloId(moduloId)
        } catch (error) {
          console.warn('No se pudo cargar el progreso de modulos.', error)
        }
      }

      void loadProgress()
      return () => {
        isActive = false
      }
    }, [])
  )

  const isTutorialEnabled = isModuloUnlocked({ moduloId: 0, firstPendingModuloId: firstAvailableModuloId })
  const isDiabetesModuloEnabled = isModuloUnlocked({ moduloId: 1, firstPendingModuloId: firstAvailableModuloId })
  const isNextModuloEnabled = isModuloUnlocked({ moduloId: 2, firstPendingModuloId: firstAvailableModuloId })
  const isModuloTresEnabled = isModuloUnlocked({ moduloId: 3, firstPendingModuloId: firstAvailableModuloId })

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Modulos</Text>
        <Text style={styles.subtitle}>Solo el primer modulo no completado esta disponible</Text>
        <View style={styles.separator} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tutorial</Text>
          <Text style={styles.cardDescription}>Primer modulo para aprender el flujo base de la app.</Text>

          <Pressable
            onPress={() => router.push('/modulos/tutorial')}
            disabled={!isTutorialEnabled}
            accessibilityRole="button"
            accessibilityLabel="Abrir modulo tutorial"
            style={({ pressed }) => [
              styles.button,
              !isTutorialEnabled && styles.buttonDisabled,
              pressed && isTutorialEnabled && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>{isTutorialEnabled ? 'Abrir' : 'Bloqueado'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>La Diabetes</Text>
          <Text style={styles.cardDescription}>¿En qué consiste la diabetes en si?</Text>

          <Pressable
            onPress={() => {
              if (!isDiabetesModuloEnabled) return
              router.push('/modulos/la-diabetes')
            }}
            disabled={!isDiabetesModuloEnabled}
            accessibilityRole="button"
            accessibilityLabel="Abrir modulo La Diabetes"
            style={({ pressed }) => [
              styles.button,
              !isDiabetesModuloEnabled && styles.buttonDisabled,
              pressed && isDiabetesModuloEnabled && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>{isDiabetesModuloEnabled ? 'Abrir' : 'Bloqueado'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>La Insulinoterapia</Text>
          <Text style={styles.cardDescription}>¿En qué consiste la insulinoterapia?</Text>

          <Pressable
            onPress={() => {
              if (!isNextModuloEnabled) return
              router.push('/modulos/la-insulinoterapia')
            }}
            disabled={!isNextModuloEnabled}
            accessibilityRole="button"
            accessibilityLabel="Abrir modulo La Insulinoterapia"
            style={({ pressed }) => [
              styles.button,
              !isNextModuloEnabled && styles.buttonDisabled,
              pressed && isNextModuloEnabled && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>{isNextModuloEnabled ? 'Abrir' : 'Bloqueado'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Control de la glucosa</Text>
          <Text style={styles.cardDescription}>¿Como se controla la diabetes en la vida diaria?</Text>

          <Pressable
            onPress={() => {
              if (!isModuloTresEnabled) return
              router.push('/modulos/modulo-3')
            }}
            disabled={!isModuloTresEnabled}
            accessibilityRole="button"
            accessibilityLabel="Abrir modulo Control de la glucosa"
            style={({ pressed }) => [
              styles.button,
              !isModuloTresEnabled && styles.buttonDisabled,
              pressed && isModuloTresEnabled && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>{isModuloTresEnabled ? 'Abrir' : 'Bloqueado'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  content: {
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
  card: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    padding: 14,
    backgroundColor: WHITE,
  },
  cardTitle: {
    color: BLUE,
    fontSize: 20,
    fontWeight: '800',
  },
  cardDescription: {
    color: BLUE_SECONDARY,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    minHeight: 48,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#A8CDE8',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
})
