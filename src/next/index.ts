import { NodeEditor, Scope } from 'rete'
import { Area2DInherited, AreaPlugin } from 'rete-area-plugin'

import { ClassicFlow, Flow } from './flow'
import { EventType } from './flow/base'
import { createPseudoconnection } from './pseudoconnection'
import { ClassicScheme, Connection, SocketData } from './types'
import { findSocket } from './utils'

export * from './flow'
export type { Connection } from './types'

console.log('connection')

type ExpectArea2DExtra = { type: 'render', data: SocketData }
export class ConnectionPlugin<Schemes extends ClassicScheme, K> extends Scope<Connection, Area2DInherited<Schemes, ExpectArea2DExtra>> {
    constructor(editor: NodeEditor<Schemes>, areaPlugin: AreaPlugin<Schemes, K>, props?: { flow?: Flow<Schemes, any[]> }) {
        super('connection')
        const preudoconnection = createPseudoconnection(areaPlugin)
        const socketsCache = new Map<Element, SocketData>()
        const flow: Flow<Schemes, any[]> = props?.flow || new ClassicFlow()
        const flowContext = { editor, scope: this, socketsCache }

        function update() {
            const socket = flow.getPickedSocket()

            if (socket) {
                preudoconnection.render(areaPlugin.area.pointer, socket)
            }
        }
        function pick(event: PointerEvent, type: EventType) {
            const pointedElements = document.elementsFromPoint(event.clientX, event.clientY)
            const pickedSocket = findSocket(socketsCache, pointedElements)

            event.preventDefault()
            event.stopPropagation()

            if (pickedSocket) {
                flow.pick(pickedSocket, type, flowContext)
            } else {
                flow.drop(flowContext)
            }
            if (!flow.getPickedSocket()) {
                preudoconnection.unmount()
            }
            update()
        }


        function pointerdownSocket(e: PointerEvent) {
            pick(e, 'down')
        }

        this.addPipe(context => {
            if (context.type === 'pointermove') {
                update()
            } else if (context.type === 'pointerup') {
                pick(context.data.event, 'up')
            } else if (context.type === 'render' && context.data.type === 'socket') {
                const { element } = context.data

                element.addEventListener('pointerdown', pointerdownSocket)
                socketsCache.set(element, context.data)
            } else if (context.type === 'unmount') {
                const { element } = context.data

                element.removeEventListener('pointerdown', pointerdownSocket)
                socketsCache.delete(element)
            }
            return context
        })
    }
}
