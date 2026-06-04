import { Fragment, type ReactNode } from 'react'
import { Text, type StyleProp, type TextStyle } from 'react-native'

const EMPHASIS_ORANGE = '#D97706'

export interface RichToken {
  text: string
  bold: boolean
  italic: boolean
}

export function stripInlineRichTextMarkup(text: string) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
}

export function parseRichTokens(text: string): RichToken[] {
  const pattern = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*)/g
  const chunks = text.split(pattern).filter(Boolean)

  return chunks.map(chunk => {
    if (chunk.startsWith('***') && chunk.endsWith('***')) {
      return { text: chunk.slice(3, -3), bold: true, italic: true }
    }
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return { text: chunk.slice(2, -2), bold: true, italic: false }
    }
    if (chunk.startsWith('*') && chunk.endsWith('*')) {
      return { text: chunk.slice(1, -1), bold: false, italic: true }
    }
    return { text: chunk, bold: false, italic: false }
  })
}

export function getVisibleRichTokens({
  text,
  visibleChars,
}: {
  text: string
  visibleChars: number
}): RichToken[] {
  const tokens = parseRichTokens(text)
  if (visibleChars <= 0) return []

  let remaining = visibleChars
  const visibleTokens: RichToken[] = []

  for (const token of tokens) {
    if (remaining <= 0) break
    const takeCount = Math.min(remaining, token.text.length)
    if (takeCount > 0) {
      visibleTokens.push({
        ...token,
        text: token.text.slice(0, takeCount),
      })
    }
    remaining -= takeCount
  }

  return visibleTokens
}

export function renderRichTokens({
  tokens,
  baseStyle,
}: {
  tokens: RichToken[]
  baseStyle: StyleProp<TextStyle>
}): ReactNode {
  return (
    <Text style={baseStyle}>
      {tokens.map((token, index) => (
        <Fragment key={`${index}-${token.text}`}>
          <Text
            style={{
              fontWeight: token.bold ? '800' : '600',
              fontStyle: token.italic ? 'italic' : 'normal',
              color: token.bold ? EMPHASIS_ORANGE : undefined,
            }}>
            {token.text}
          </Text>
        </Fragment>
      ))}
    </Text>
  )
}

export function renderInlineRichText({
  text,
  baseStyle,
}: {
  text: string
  baseStyle: StyleProp<TextStyle>
}): ReactNode {
  const tokens = parseRichTokens(text)
  return renderRichTokens({ tokens, baseStyle })
}
