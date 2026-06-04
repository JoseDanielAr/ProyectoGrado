import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  getModuloClasesProgress,
  isClaseUnlocked,
  isNotCompleted,
  type ClaseProgress,
} from '@/lib/db/modulo-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'
const MODULO_ID = 0

interface ContentCard {
  id: number
  title: string
  description: string
  isAvailable: boolean
}

function CardButton({
  label,
  onPress,
  isAvailable,
}: {
  label: string
  onPress: () => void
  isAvailable: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!isAvailable}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.cardButton,
        !isAvailable && styles.cardButtonDisabled,
        pressed && isAvailable && styles.buttonPressed,
      ]}>
      <Text style={styles.cardButtonText}>{isAvailable ? label : 'Bloqueado'}</Text>
    </Pressable>
  )
}

export default function TutorialModuloScreen() {
  const router = useRouter()
  const [clases, setClases] = useState<ClaseProgress[]>([])

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      async function loadProgress() {
        try {
          const clasesRows = await getModuloClasesProgress({ moduloId: MODULO_ID })

          if (!isActive) return
          setClases(clasesRows)
        } catch (error) {
          console.warn('No se pudo cargar el progreso del modulo tutorial.', error)
        }
      }

      void loadProgress()
      return () => {
        isActive = false
      }
    }, [])
  )

  const firstPendingClaseId = useMemo(() => {
    const nextClase = clases.find(clase => isNotCompleted({ estadoId: clase.estadoId }))
    return nextClase?.claseId ?? null
  }, [clases])

  const classCards = useMemo(() => {
    return clases.map(clase => {
      if (clase.claseId === 0) {
        return {
          id: clase.claseId,
          title: '¡Bienvenido a Insulinapp!',
          description: 'Antes de empezar, te enseñaremos como funciona la aplicacion.',
          isAvailable: isClaseUnlocked({ claseId: clase.claseId, firstPendingClaseId }),
        } satisfies ContentCard
      }

      return {
        id: clase.claseId,
        title: `Clase ${clase.claseId}`,
        description: 'Contenido de clase pendiente de configurar.',
        isAvailable: isClaseUnlocked({ claseId: clase.claseId, firstPendingClaseId }),
      } satisfies ContentCard
    })
  }, [clases, firstPendingClaseId])

  function showComingSoon({ itemName }: { itemName: string }) {
    Alert.alert('Proximamente', `${itemName} estara disponible en una siguiente version.`)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Clases</Text>
        <View style={styles.cardsContainer}>
          {classCards.map(card => (
            <View key={`clase-${card.id}`} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
              <CardButton
                label="Iniciar"
                isAvailable={card.isAvailable}
                onPress={() => {
                  if (card.id === 0 && card.isAvailable) {
                    router.push('/modulos/tutorial-conjunto')
                    return
                  }
                  showComingSoon({ itemName: card.title })
                }}
              />
            </View>
          ))}
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
    paddingTop: 18,
    paddingBottom: 32,
    backgroundColor: WHITE,
  },
  sectionTitle: {
    color: BLUE,
    fontSize: 22,
    fontWeight: '800',
  },
  cardsContainer: {
    marginTop: 10,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    backgroundColor: WHITE,
    padding: 14,
  },
  cardTitle: {
    color: BLUE,
    fontSize: 19,
    fontWeight: '800',
  },
  cardDescription: {
    color: BLUE_SECONDARY,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
    fontWeight: '600',
  },
  cardButton: {
    width: '100%',
    minHeight: 46,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardButtonDisabled: {
    backgroundColor: '#A8CDE8',
  },
  cardButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
})
