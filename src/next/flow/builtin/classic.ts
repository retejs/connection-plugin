import { getUID } from 'rete'

import { ClassicScheme, SocketData } from '../../types'
import { Context, EventType, Flow } from '../base'

export class ClassicFlow<Schemes extends ClassicScheme, K extends any[]> implements Flow<Schemes, K> {
    private initial: SocketData | undefined
    private currentlyPickedConnection?: ClassicScheme['Connection']

    private createConnection(source: SocketData, target: SocketData, context: Context<Schemes, K>) {
        context.editor.addConnection({
            id: getUID(),
            source: source.nodeId,
            sourceOutput: source.key,
            target: target.nodeId,
            targetInput: target.key
        })
    }

    private makeConnection(initial: SocketData, socket: SocketData, context: Context<Schemes, K>) {
        const forward = initial.side === 'output' && socket.side === 'input'
        const backward = initial.side === 'input' && socket.side === 'output'
        const [source, target] = forward
            ? [this.initial, socket]
            : (backward ? [socket, initial] : [])

        if (source && target) {
            this.createConnection(source, target, context)
            this.drop(context)
        }
    }

    // eslint-disable-next-line max-statements
    public pick(socket: SocketData, event: EventType, context: Context<Schemes, K>) {
        if (this.initial && (!this.currentlyPickedConnection || !(socket.side === 'input' && this.currentlyPickedConnection.target === socket.nodeId && this.currentlyPickedConnection.targetInput === socket.key))) {
            this.makeConnection(this.initial, socket, context)
        } else if (event === 'down') {
            if (socket.side === 'input') {
                const connection = context
                    .editor.getConnections()
                    .find(item => item.target === socket.nodeId && item.targetInput === socket.key)

                if (this.currentlyPickedConnection && this.initial) {
                    this.makeConnection(this.initial, socket, context)
                    this.drop(context)
                } else if (connection) {
                    this.currentlyPickedConnection = connection
                    const outputSocket = Array.from(context.socketsCache.values()).find(data => {
                        return data.nodeId === connection.source && data.side === 'output' && data.key === connection.sourceOutput
                    })

                    if (!outputSocket) throw new Error('cannot find output socket')

                    context.editor.removeConnection(connection.id)
                    this.initial = outputSocket
                } else {
                    this.initial = socket
                }
            } else {
                this.initial = socket
            }
        }
    }

    public async restoreConnection(context: Context<Schemes, K>) {
        if (this.currentlyPickedConnection) {
            await context.editor.addConnection(this.currentlyPickedConnection)
        }
    }

    public getPickedSocket() {
        return this.initial
    }

    public drop(context: Context<Schemes, K>) {
        if (this.initial) {
            context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
        }
        delete this.currentlyPickedConnection
        delete this.initial
    }
}
