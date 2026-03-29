import { BoundingBoxEngine } from '@/components/bounding-box-engine'

const BOUNDING_BOX_ENGINE_TEST_SOURCE = [
  '1. "Toca dentro del recuadro correcto"',
  '2. "Si aciertas veras bien, si no veras mal"',
].join('\n')

export default function PruebaBoundingBoxEngineScreen() {
  return (
    <BoundingBoxEngine
      title="Bounding Box engine"
      textSource={BOUNDING_BOX_ENGINE_TEST_SOURCE}
      imageSource={require('@/assets/InsulinApp/BoundingBoxes/BoundingBoxEngineTest.png')}
      imageSizePx={{ width: 1536, height: 864 }}
      boundingBoxPixels={{ minX: 948, maxX: 1304, minY: 285, maxY: 591 }}
      insideResultText="bien"
      outsideResultText="mal"
    />
  )
}
