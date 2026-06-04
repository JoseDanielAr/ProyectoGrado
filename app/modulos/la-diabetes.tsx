import { useFocusEffect } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  getModuloClasesProgress,
  getModuloQuizzesProgress,
  isClaseUnlocked,
  isCompleted,
  isNotCompleted,
  type ClaseProgress,
  type QuizProgress,
} from '@/lib/db/modulo-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'
const ORANGE = '#D97706'
const ORANGE_SECONDARY = '#B45309'
const MODULO_ID = 1
const QUIZ_ID = 1

interface ClaseCard {
  claseId: number
  title: string
  description: string
  isAvailable: boolean
}

function ClaseButton({
  label,
  onPress,
  isAvailable,
  color,
  disabledColor,
}: {
  label: string
  onPress: () => void
  isAvailable: boolean
  color: string
  disabledColor: string
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!isAvailable}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.cardButton,
        { backgroundColor: color },
        !isAvailable && styles.cardButtonDisabled,
        !isAvailable && { backgroundColor: disabledColor },
        pressed && isAvailable && styles.buttonPressed,
      ]}>
      <Text style={styles.cardButtonText}>{isAvailable ? label : 'Bloqueado'}</Text>
    </Pressable>
  )
}

export default function ModuloLaDiabetesScreen() {
  const router = useRouter()
  const [clases, setClases] = useState<ClaseProgress[]>([])
  const [quizzes, setQuizzes] = useState<QuizProgress[]>([])

  useFocusEffect(
    useCallback(() => {
      let isActive = true

      async function loadProgress() {
        try {
          const [clasesRows, quizzesRows] = await Promise.all([
            getModuloClasesProgress({ moduloId: MODULO_ID }),
            getModuloQuizzesProgress({ moduloId: MODULO_ID }),
          ])
          if (!isActive) return
          setClases(clasesRows)
          setQuizzes(quizzesRows)
        } catch (error) {
          console.warn('No se pudo cargar el progreso del modulo La Diabetes.', error)
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

  const cards = useMemo(() => {
    const baseCards = [
      {
        claseId: 1,
        title: 'El Pancreas',
        description:
          'Entiende primero el organo clave para el manejo del azucar en tu cuerpo.',
      },
      {
        claseId: 2,
        title: 'La diabetes',
        description: '¿Qué es la diabetes y la prediabetes?',
      },
      {
        claseId: 3,
        title: 'Los Tipos de Diabetes',
        description: '¿Cuales son los tipos d ediabetes y en qué se diferencian?',
      },
      {
        claseId: 4,
        title: 'Sintomas de la DIabetes',
        description: '¿Cuales son los sintomas más comunes? ¿Por qué ocurren?',
      },
    ]

    return baseCards.map(card => ({
      ...card,
      isAvailable: isClaseUnlocked({ claseId: card.claseId, firstPendingClaseId }),
    })) satisfies ClaseCard[]
  }, [firstPendingClaseId])

  const quizCard = useMemo(() => {
    const quiz = quizzes.find(row => row.quizId === QUIZ_ID) ?? null
    const allClassesCompleted = clases.length > 0 && clases.every(row => isCompleted({ estadoId: row.estadoId }))
    return {
      quizId: QUIZ_ID,
      title: 'Quiz',
      description: 'Este es el quiz del módulo',
      isAvailable: allClassesCompleted || (quiz ? isCompleted({ estadoId: quiz.estadoId }) : false),
    }
  }, [clases, quizzes])

  function handleStart({ claseId, title }: { claseId: number; title: string }) {
    if (claseId === 1) {
      router.push('/modulos/la-diabetes-clase-1')
      return
    }
    if (claseId === 2) {
      router.push('/modulos/la-diabetes-clase-2')
      return
    }
    if (claseId === 3) {
      router.push('/modulos/la-diabetes-clase-3')
      return
    }
    if (claseId === 4) {
      router.push('/modulos/la-diabetes-clase-4')
      return
    }
    Alert.alert('Clase', `Aquí iniciaremos ${title} (ClaseID ${claseId}).`)
  }

  function handleStartQuiz() {
    router.push('/modulos/la-diabetes-quiz-1')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Clases</Text>
        <View style={styles.cardsContainer}>
          {cards.map(card => (
            <View key={`clase-${card.claseId}`} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
              <ClaseButton
                label="Iniciar"
                isAvailable={card.isAvailable}
                color={BLUE}
                disabledColor="#A8CDE8"
                onPress={() => handleStart({ claseId: card.claseId, title: card.title })}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, styles.quizSectionTitle]}>Evaluación</Text>
        <View style={[styles.card, styles.quizCard]}>
          <Text style={[styles.cardTitle, styles.quizCardTitle]}>{quizCard.title}</Text>
          <Text style={[styles.cardDescription, styles.quizCardDescription]}>{quizCard.description}</Text>
          <ClaseButton
            label="Iniciar"
            isAvailable={quizCard.isAvailable}
            color={ORANGE}
            disabledColor="#E9C89E"
            onPress={handleStartQuiz}
          />
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
    opacity: 1,
  },
  cardButtonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  quizSectionTitle: {
    marginTop: 18,
    color: ORANGE,
  },
  quizCard: {
    marginTop: 10,
    borderColor: ORANGE_SECONDARY,
  },
  quizCardTitle: {
    color: ORANGE,
  },
  quizCardDescription: {
    color: ORANGE_SECONDARY,
  },
})
