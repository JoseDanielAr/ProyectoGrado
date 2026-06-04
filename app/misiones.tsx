import { useFocusEffect } from '@react-navigation/native'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MISION_PUNTAJE, readDailyMisionState, type DailyMisionState } from '@/lib/misiones/misiones-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'
const BLUE_DISABLED = '#A8CDE8'

const EMPTY_MISSION: DailyMisionState = {
  dia: null,
  tipo: null,
  completada: false,
  claseId: null,
  description: 'Cargando mision...',
  puntajeReward: MISION_PUNTAJE,
}

export default function MisionesScreen() {
  const [mission, setMission] = useState<DailyMisionState>(EMPTY_MISSION)

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      async function loadMission() {
        try {
          const state = await readDailyMisionState()
          if (!isActive) return
          setMission(state)
        } catch (error) {
          console.warn('No se pudo cargar la mision diaria.', error)
        }
      }

      void loadMission()
      return () => {
        isActive = false
      }
    }, [])
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Misiones Diarias</Text>
        <View style={styles.separator} />

        <Text style={styles.intro}>
          Estas son tus misiones de hoy. Manten la racha viva completando tus misiones diarias.
        </Text>

        <Text style={styles.missionDescription}>{mission.description}</Text>

        <Text style={styles.puntajeLabel}>Puntaje: {mission.puntajeReward}</Text>

        <View style={[styles.statusBox, !mission.completada && styles.statusBoxPending]}>
          <Text style={[styles.statusText, !mission.completada && styles.statusTextPending]}>
            {mission.completada ? '¡Completado!' : 'Sin completar'}
          </Text>
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
  separator: {
    width: '100%',
    height: 1,
    marginTop: 14,
    backgroundColor: '#D9D9D9',
  },
  intro: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    marginTop: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  missionDescription: {
    color: BLUE,
    fontSize: 18,
    marginTop: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  puntajeLabel: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    marginTop: 14,
    fontWeight: '700',
  },
  statusBox: {
    marginTop: 12,
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  statusBoxPending: {
    borderColor: BLUE_DISABLED,
    backgroundColor: BLUE_DISABLED,
  },
  statusText: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '800',
  },
  statusTextPending: {
    color: '#F4F9FD',
  },
})
