import { PruebaTextoEngine } from '@/components/prueba-texto-engine'

const PRUEBA_TEXTO_SOURCE = [
  '1. "Esta es la prueba para el texto al estilo typewriter"',
  '2. "Al hacer click, deberias ver lo siguiente"',
  '3. "Mi animacion de hablar, este texto..."',
  '4. "Y mi hermosa voz, claro"',
  '5. "Aunque eso no es como si lo vieras... Pero bueno"',
].join('\n')

export default function PruebaTextoScreen() {
  return <PruebaTextoEngine title="Prueba de texto" textSource={PRUEBA_TEXTO_SOURCE} muteBackgroundMusic />
}
