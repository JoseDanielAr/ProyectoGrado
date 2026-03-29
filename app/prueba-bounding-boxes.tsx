import { BoundingBoxEngine } from '@/components/bounding-box-engine'

const BOUNDING_BOX_TEXT_SOURCE = [
  '1. "Toca para avanzar entre instrucciones"',
  '2. "Aqui probaremos deteccion dentro y fuera de cajas"',
  '3. "La imagen de abajo sera nuestra zona de prueba"',
].join('\n')

export default function PruebaBoundingBoxesScreen() {
  return (
    <BoundingBoxEngine
      title="Bounding Boxes"
      textSource={BOUNDING_BOX_TEXT_SOURCE}
      imageSource={require('@/assets/InsulinApp/BoundingBoxes/BoundingBoxTest.png')}
      imageSizePx={{ width: 2048, height: 2048 }}
      boundingBoxPixels={{ minX: 189, maxX: 850, minY: 302, maxY: 968 }}
      insideResultText="bien"
      outsideResultText="mal"
    />
  )
}
