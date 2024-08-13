import { SocketData } from './types'
/**
 * @param elements list of Element returned by document.elementsFromPoint
 */
export function findSocket(socketsCache: WeakMap<Element, SocketData>, elements: Element[]) {
  for (const element of elements) {
    const found = socketsCache.get(element)

    if (found) {
      return found
    }
  }
}

/**
 * Alternative to document.elementsFromPoint that traverses shadow roots
 * @param x x coordinate
 * @param y y coordinate
 * @param root root element to search in
 */
export function elementsFromPoint(x: number, y: number, root: ShadowRoot | Document = document) {
  const elements = root.elementsFromPoint(x, y)
  const shadowRoot = elements[0]?.shadowRoot

  if (shadowRoot && shadowRoot !== root) {
    elements.unshift(...elementsFromPoint(x, y, shadowRoot))
  }

  return elements
}
