import { BaseSchemes, NodeEditor, Scope } from 'rete'

import { Connection, SocketData } from '../types'

export type Context<Schemes extends BaseSchemes, K extends any[]> = {
    editor: NodeEditor<Schemes>
    scope: Scope<Connection, K>
    socketsCache: Map<Element, SocketData>
}
export type EventType = 'up' | 'down'
export type PickParams = { socket: SocketData, event: EventType }

export abstract class Flow<Schemes extends BaseSchemes, K extends any[]> {
    public abstract pick(params: PickParams, context: Context<Schemes, K>): void
    public abstract getPickedSocket(): SocketData | undefined
    public abstract drop(context: Context<Schemes, K>): void
}
