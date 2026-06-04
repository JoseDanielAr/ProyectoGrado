import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { hasCompletedAnyModulo, getRepasoQuestionPool } from '@/lib/repaso/repaso-repo'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

export default function RepasoScreen() {
  const router = useRouter()

  async function handleStart() {
    try {
      const [moduloCompleted, pool] = await Promise.all([hasCompletedAnyModulo(), getRepasoQuestionPool()])
      if (!moduloCompleted || !pool.length) {
        Alert.alert('', 'Debes completar al menos un modulo antes de continuar')
        return
      }

      router.push('/repaso-session')
    } catch (error) {
      console.warn('No se pudo iniciar el repaso.', error)
      Alert.alert('', 'Debes completar al menos un modulo antes de continuar')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Repaso</Text>
        <View style={styles.separator} />

        <View style={styles.hero}>
          <Image
            source={require('@/assets/InsulinApp/Mascota/MascotaSensei.png')}
            contentFit="contain"
            style={styles.mascot}
            accessibilityLabel="Mascota sensei"
          />
        </View>

        <Text style={styles.headline}>¡Repasa todo lo que has aprendido!</Text>
        <View style={styles.separator} />

        <Text style={styles.description}>
          Aqui puedes ponerte a prueba y responder preguntas de todos los quizzes que has completado hasta ahora. No hay
          puntaje ni limite de tiempo, entonces enfocate en recordar lo más que puedas sin presión.
        </Text>

        <Pressable
          onPress={() => void handleStart()}
          accessibilityRole="button"
          accessibilityLabel="Empezar repaso"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Empezar</Text>
        </Pressable>
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
    flexGrow: 1,
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
  headline: {
    color: BLUE,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center',
  },
  description: {
    color: BLUE_SECONDARY,
    fontSize: 16,
    marginTop: 14,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'left',
  },
  separator: {
    width: '100%',
    height: 1,
    marginTop: 14,
    backgroundColor: '#D9D9D9',
  },
  hero: {
    alignItems: 'center',
    marginTop: 4,
  },
  mascot: {
    width: 220,
    height: 220,
  },
  button: {
    width: '100%',
    minHeight: 48,
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
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
