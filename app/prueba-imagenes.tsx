import { PruebaTextoEngine } from '@/components/prueba-texto-engine'

const IMAGENES_TEST_SOURCE = [
  '1. "Vamos a ver si puedo cambiar mi look"',
  '2. "Uno, dos... TRES!" (Shift to ImagenPrueba)',
  '3. "Me veo bien?"',
  '4. "E-Enserio?" (Shift to default)',
  '5. "Yo prefiero ser un robot..."',
  '6. "Tu tambien me prefieres como robot?" (Cut to MascotaOops)',
  '7. "Gracias!" (Cut to MascotaFeliz)',
].join('\n')

const IMAGENES_ASSET_MAP = {
  ImagenPrueba: require('@/assets/Prueba/Imagenes/ImagenPrueba.png'),
  MascotaOops: require('@/assets/InsulinApp/Mascota/MascotaOops.png'),
  MascotaFeliz: require('@/assets/InsulinApp/Mascota/MascotaFeliz.png'),
}

export default function PruebaImagenesScreen() {
  return (
    <PruebaTextoEngine title="Prueba imagenes" textSource={IMAGENES_TEST_SOURCE} imageAssetMap={IMAGENES_ASSET_MAP} />
  )
}
