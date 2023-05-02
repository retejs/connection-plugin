import { getUID } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'

import { ClassicScheme, Position, SocketData } from './types'

export function createPseudoconnection<Schemes extends ClassicScheme, K>(extra?: Partial<Schemes['Connection']>) {
  const element = document.createElement('div')
  let id: string | null = null

  element.style.position = 'absolute'
  element.style.left = '0'
  element.style.top = '0'

  return {
    isMounted() {
      return Boolean(id)
    },
    mount(areaPlugin: AreaPlugin<Schemes, K>) {
      id = `pseudo_${getUID()}`
      areaPlugin.area.content.add(element)
    },
    render(areaPlugin: AreaPlugin<Schemes, K>, { x, y }: Position, data: SocketData) {
      const isOutput = data.side === 'output'
      const pointer = { x: x + (isOutput ? -3 : 3), y } // fix hover of underlying elements

      if (!id) throw new Error('pseudo connection id wasn\'t generated')

      areaPlugin.emit({
        type: 'render', data: {
          element,
          type: 'connection',
          payload: isOutput ? {
            id,
            source: data.nodeId,
            sourceOutput: data.key,
            target: '',
            targetInput: '',
            ...(extra || {})
          } : {
            id,
            target: data.nodeId,
            targetInput: data.key,
            source: '',
            sourceOutput: '',
            ...(extra || {})
          },
          ...(isOutput ? { end: pointer } : { start: pointer })
        }
      })
    },
    unmount(areaPlugin: AreaPlugin<Schemes, K>) {
      id = null
      areaPlugin.emit({ type: 'unmount', data: { element } })
    }
  }
}
