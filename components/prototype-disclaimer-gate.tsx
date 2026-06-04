import { useEffect, useState, type ReactNode } from 'react'
import { AppState, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const DISCLAIMER_BULLETS = [
  'Esta aplicación es un prototipo exclusivo para probar componentes de software.',
  'Esta aplicación no cuenta con aval médico ni validación clínica.',
  'El contenido sobre diabetes es simulado a partir de fuentes públicas. No la use para tomar decisiones de salud ni como reemplazo de la atención médica.',
]

interface PrototypeDisclaimerGateProps {
  children: ReactNode
}

function DisclaimerBulletItem({ text, isFirst }: { text: string; isFirst: boolean }) {
  return (
    <View style={[styles.bulletRow, isFirst && styles.bulletRowFirst]}>
      <Text style={styles.bulletMarker}>{'\u2022'}</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  )
}

export function PrototypeDisclaimerGate({ children }: PrototypeDisclaimerGateProps) {
  const [isDisclaimerVisible, setIsDisclaimerVisible] = useState(true)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') return
      setIsDisclaimerVisible(true)
    })

    return () => subscription.remove()
  }, [])

  function handleAccept() {
    setIsDisclaimerVisible(false)
  }

  return (
    <>
      {children}
      <Modal
        visible={isDisclaimerVisible}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => {}}>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.card}>
              <Text style={styles.title}>Aviso importante</Text>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.textBox}>
                  {DISCLAIMER_BULLETS.map((bullet, index) => (
                    <DisclaimerBulletItem key={bullet} text={bullet} isFirst={index === 0} />
                  ))}
                </View>
              </ScrollView>
              <Pressable
                onPress={handleAccept}
                accessibilityRole="button"
                accessibilityLabel="Entiendo"
                style={({ pressed }) => [styles.acceptButton, pressed && styles.acceptButtonPressed]}>
                <Text style={styles.acceptButtonText}>Entiendo</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  )
}

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    maxHeight: '88%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    backgroundColor: WHITE,
    padding: 20,
  },
  title: {
    color: BLUE,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  textBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BLUE_SECONDARY,
    backgroundColor: WHITE,
    padding: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  bulletRowFirst: {
    marginTop: 0,
  },
  bulletMarker: {
    color: BLUE,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    width: 18,
    marginRight: 8,
  },
  body: {
    flex: 1,
    color: BLUE_SECONDARY,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  acceptButton: {
    width: '100%',
    minHeight: 52,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BLUE,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonPressed: {
    opacity: 0.85,
  },
  acceptButtonText: {
    color: BLUE,
    fontSize: 17,
    fontWeight: '700',
  },
})
