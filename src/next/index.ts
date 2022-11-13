import { CanAssignSignal, NodeEditor, Scope } from 'rete'
import { Area2DInherited, AreaPlugin } from 'rete-area-plugin'

import { ClassicFlow, Flow } from './flow'
import { EventType } from './flow/base'
import { createPseudoconnection } from './pseudoconnection'
import { ClassicScheme, Connection, SocketData } from './types'
import { findSocket } from './utils'

export * from './flow'
export type { Connection } from './types'

console.log('connection')

export type ExpectArea2DExtra = { type: 'render', data: SocketData }

type IsCompatible<K> = K extends { data: infer P } ? CanAssignSignal<P, SocketData> : false // TODO should add type: 'render' ??
type Substitute<K> = IsCompatible<K> extends true ? K : ExpectArea2DExtra

export class ConnectionPlugin<Schemes extends ClassicScheme, K> extends Scope<
    Connection,
    Area2DInherited<Schemes, Substitute<K>>
> {
    constructor(props: {
        editor: NodeEditor<Schemes>,
        area: AreaPlugin<Schemes, Substitute<K>>,
        flow?: Flow<Schemes, any[]>
    }) {
        super('connection')
        const { area: areaPlugin, editor } = props
        const preudoconnection = createPseudoconnection(areaPlugin as AreaPlugin<Schemes, K>)
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
                flow.pick({ socket: pickedSocket, event: type }, flowContext)
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

        // eslint-disable-next-line max-statements
        this.addPipe(context => {
            if (!('type' in context)) return context

            if (context.type === 'pointermove') {
                update()
            } else if (context.type === 'pointerup') {
                pick(context.data.event, 'up')
            } else if (context.type === 'render') {
                const withExtra = context as (typeof context) | ExpectArea2DExtra // inject extra type

                if (withExtra.data.type === 'socket') {
                    const { element } = withExtra.data

                    element.addEventListener('pointerdown', pointerdownSocket)
                    socketsCache.set(element, withExtra.data)
                }
            } else if (context.type === 'unmount') {
                const { element } = context.data

                element.removeEventListener('pointerdown', pointerdownSocket)
                socketsCache.delete(element)
            }
            return context
        })
    }
}
