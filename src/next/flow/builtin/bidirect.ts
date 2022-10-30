import { getUID } from 'rete'

import { ClassicScheme, SocketData } from '../../types'
import { Context, EventType, Flow } from '../base'

export class BidirectFlow<Schemes extends ClassicScheme, K extends any[]> implements Flow<Schemes, K> {
    private initial: SocketData | undefined

    constructor(private props?: { pickByClick?: boolean }) { }

    private createConnection(source: SocketData, target: SocketData, context: Context<Schemes, K>) {
        context.editor.addConnection({
            id: getUID(),
            source: source.nodeId,
            sourceOutput: source.key,
            target: target.nodeId,
            targetInput: target.key
        })
    }

    private isSame(a: SocketData, b: SocketData) {
        return a.key === b.key && a.nodeId === b.nodeId && a.side === b.side
    }

    public pick(socket: SocketData, event: EventType, context: Context<Schemes, K>) {
        if (!this.props?.pickByClick && this.initial && this.isSame(this.initial, socket)) {
            this.drop(context)
        } else if (this.initial) {
            const forward = this.initial.side === 'output' && socket.side === 'input'
            const backward = this.initial.side === 'input' && socket.side === 'output'
            const [source, target] = forward
                ? [this.initial, socket]
                : (backward ? [socket, this.initial] : [])

            if (source && target) {
                this.createConnection(source, target, context)
                this.drop(context)
            }
        } else if (event === 'down') {
            this.initial = socket
        }
    }

    public getPickedSocket() {
        return this.initial
    }

    public drop(context: Context<Schemes, K>) {
        if (this.initial) {
            context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
            delete this.initial
        }
    }
}
