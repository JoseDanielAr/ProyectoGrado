declare module 'react-native-typewriter' {
  import type { ComponentType } from 'react'
  import type { TextProps } from 'react-native'

  interface TypeWriterProps extends TextProps {
    typing?: number | boolean
    minDelay?: number
    maxDelay?: number
    onTypingEnd?: () => void
  }

  const TypeWriter: ComponentType<TypeWriterProps>
  export default TypeWriter
}
