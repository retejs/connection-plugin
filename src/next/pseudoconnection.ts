import { AreaPlugin } from 'rete-area-plugin'

import { ClassicScheme, Position, SocketData } from './types'

export function createPseudoconnection<Schemes extends ClassicScheme, K>(areaPlugin: AreaPlugin<Schemes, K>) {
    const element = document.createElement('div')

    element.style.position = 'absolute'
    element.style.left = '0'
    element.style.top = '0'

    areaPlugin.area.appendChild(element)

    return {
        element: element,
        render(pointer: Position, data: SocketData) {
            const isOutput = data.side === 'output'

            areaPlugin.emit({
                type: 'render', data: {
                    element,
                    type: 'connection',
                    payload: isOutput ? {
                        id: '',
                        source: data.nodeId,
                        sourceOutput: data.key,
                        target: '',
                        targetInput: ''
                    } : {
                        id: '',
                        target: data.nodeId,
                        targetInput: data.key,
                        source: '',
                        sourceOutput: ''
                    },
                    ...(isOutput ? { end: pointer } : { start: pointer })
                }
            })
        },
        unmount() {
            areaPlugin.emit({ type: 'unmount', data: { element } })
        }
    }
}
