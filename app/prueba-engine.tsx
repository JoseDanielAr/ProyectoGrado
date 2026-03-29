import { PruebaTextoEngine } from '@/components/prueba-texto-engine'

const ENGINE_TEST_SOURCE = [
  '1. "Hola, si estas viendo esto"',
  '2. "Luego esto"',
  '3. "Y ahora esto..."',
  '4. "entonces el engine funciona"',
].join('\n')

export default function PruebaEngineScreen() {
  return <PruebaTextoEngine title="Prueba engine" textSource={ENGINE_TEST_SOURCE} muteBackgroundMusic />
}
