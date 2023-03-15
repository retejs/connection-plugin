import { getUID } from 'rete'
import { AreaPlugin } from 'rete-area-plugin'

import { ClassicScheme, Position, SocketData } from './types'

export function createPseudoconnection<Schemes extends ClassicScheme, K>() {
  const element = document.createElement('div')

  element.style.position = 'absolute'
  element.style.left = '0'
  element.style.top = '0'

  return {
    mount(areaPlugin: AreaPlugin<Schemes, K>) {
      areaPlugin.area.appendChild(element)
    },
    render(areaPlugin: AreaPlugin<Schemes, K>, { x, y }: Position, data: SocketData) {
      const isOutput = data.side === 'output'
      const pointer = { x: x + (isOutput ? -3 : 3), y } // fix hover of underlying elements

      areaPlugin.emit({
        type: 'render', data: {
          element,
          type: 'connection',
          payload: isOutput ? {
            id: getUID(),
            source: data.nodeId,
            sourceOutput: data.key,
            target: '',
            targetInput: ''
          } : {
            id: getUID(),
            target: data.nodeId,
            targetInput: data.key,
            source: '',
            sourceOutput: ''
          },
          ...(isOutput ? { end: pointer } : { start: pointer })
        }
      })
    },
    unmount(areaPlugin: AreaPlugin<Schemes, K>) {
      areaPlugin.emit({ type: 'unmount', data: { element } })
    }
  }
}
