import { useEffect, useMemo, useRef, useState } from 'react'
import { type StyleProp, type TextStyle } from 'react-native'

import { getVisibleRichTokens, parseRichTokens, renderRichTokens } from '@/components/inline-rich-text'

export function RichTypewriter({
  text,
  typing,
  minDelay = 10,
  maxDelay = 22,
  baseStyle,
  onTypingEnd,
}: {
  text: string
  typing: boolean
  minDelay?: number
  maxDelay?: number
  baseStyle: StyleProp<TextStyle>
  onTypingEnd?: () => void
}) {
  const tokens = useMemo(() => parseRichTokens(text), [text])
  const totalChars = useMemo(() => tokens.reduce((sum, token) => sum + token.text.length, 0), [tokens])
  const [visibleChars, setVisibleChars] = useState(typing ? 0 : totalChars)
  const didCallEndRef = useRef(false)

  useEffect(() => {
    didCallEndRef.current = false
    setVisibleChars(typing ? 0 : totalChars)
  }, [typing, totalChars, text])

  useEffect(() => {
    if (!typing) return
    if (visibleChars >= totalChars) {
      if (!didCallEndRef.current) {
        didCallEndRef.current = true
        onTypingEnd?.()
      }
      return
    }

    const min = Math.max(1, minDelay)
    const max = Math.max(min, maxDelay)
    const nextDelay = Math.floor(Math.random() * (max - min + 1)) + min
    const timeout = setTimeout(() => {
      setVisibleChars(previous => Math.min(previous + 1, totalChars))
    }, nextDelay)

    return () => clearTimeout(timeout)
  }, [maxDelay, minDelay, onTypingEnd, totalChars, typing, visibleChars])

  const visibleTokens = useMemo(
    () => getVisibleRichTokens({ text, visibleChars: typing ? visibleChars : totalChars }),
    [text, totalChars, typing, visibleChars]
  )

  return renderRichTokens({ tokens: visibleTokens, baseStyle })
}
