import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const WHITE = '#FFFFFF'
const BLUE = '#0094ff'
const BLUE_SECONDARY = '#1B78BA'

interface TestButtonProps {
  label: string
  onPress: () => void
}

function TestButton({ label, onPress }: TestButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      {/* Bot?n principal con el estilo visual ya definido en toda la app */}
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export default function PruebaMenuScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Men? scrollable para listar todas las pantallas de prueba futuras */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Pruebas</Text>
        <Text style={styles.subtitle}>Selecciona una pantalla de test</Text>
        <View style={styles.separator} />

        {/* Botones ordenados de arriba hacia abajo */}
        <View style={styles.buttonList}>
          <TestButton label="Texto" onPress={() => router.push('/prueba-texto')} />
          <TestButton label="engine" onPress={() => router.push('/prueba-engine')} />
          <TestButton label="Imagenes" onPress={() => router.push('/prueba-imagenes')} />
          <TestButton label="Bounding Boxes" onPress={() => router.push('/prueba-bounding-boxes')} />
          <TestButton label="Bounding Box engine" onPress={() => router.push('/prueba-bounding-box-engine')} />
          <TestButton label="Test" onPress={() => router.push('/prueba-test')} />
          <TestButton label="Engine Test" onPress={() => router.push('/prueba-engine-test')} />
          <TestButton label="conjunto" onPress={() => router.push('/prueba-conjunto')} />
          <TestButton label="Pruebas DB" onPress={() => router.push('/prueba-db')} />
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
  buttonList: {
    marginTop: 18,
    gap: 10,
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
