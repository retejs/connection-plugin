import { ClassicScheme, SocketData } from '../../types'
import { Context, Flow, PickParams } from '../base'
import { makeConnection, State, StateContext } from '../utils'

class Picked extends State<ClassicScheme, any[]> {

    constructor(public initial: SocketData) {
        super()
    }

    pick({ socket }: PickParams, context: Context<ClassicScheme, any[]>): void {
        if (makeConnection(this.initial, socket, context)) {
            this.drop(context)
        }
    }

    drop(context: Context<ClassicScheme, any[]>): void {
        if (this.initial) {
            context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
        }
        this.context.switchTo(new Idle())
    }
}

class PickedExisting extends State<ClassicScheme, any[]> {

    constructor(public connection: ClassicScheme['Connection'], context: Context<ClassicScheme, any[]>) {
        super()
        const outputSocket = Array.from(context.socketsCache.values()).find(data => {
            return data.nodeId === this.connection.source
                && data.side === 'output'
                && data.key === this.connection.sourceOutput
        })

        if (!outputSocket) throw new Error('cannot find output socket')

        context.editor.removeConnection(this.connection.id)
        this.initial = outputSocket
    }

    pick({ socket, event }: PickParams, context: Context<ClassicScheme, any[]>): void {
        if (this.initial && !(socket.side === 'input' && this.connection.target === socket.nodeId && this.connection.targetInput === socket.key)) {
            if (makeConnection(this.initial, socket, context)) {
                this.drop(context)
            }
        } else if (event === 'down') {
            if (this.initial) {
                makeConnection(this.initial, socket, context)
                this.drop(context)
            }
        }
    }

    drop(context: Context<ClassicScheme, any[]>): void {
        if (this.initial) {
            context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
        }
        this.context.switchTo(new Idle())
    }
}

class Idle extends State<ClassicScheme, any[]> {
    pick({ socket, event }: PickParams, context: Context<ClassicScheme, any[]>): void {
        if (event !== 'down') return
        if (socket.side === 'input') {
            const connection = context
                .editor.getConnections()
                .find(item => item.target === socket.nodeId && item.targetInput === socket.key)

            if (connection) {
                this.context.switchTo(new PickedExisting(connection, context))
                return
            }
        }

        this.context.switchTo(new Picked(socket))
    }

    drop(context: Context<ClassicScheme, any[]>): void {
        if (this.initial) {
            context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
        }
        delete this.initial
    }
}

export class ClassicFlow<Schemes extends ClassicScheme, K extends any[]> implements StateContext<Schemes, K>, Flow<Schemes, K> {
    currentState!: State<Schemes, K>

    constructor() {
        this.switchTo(new Idle())
    }

    public pick(params: PickParams, context: Context<Schemes, K>) {
        this.currentState.pick(params, context)
    }

    public getPickedSocket() {
        return this.currentState.initial
    }

    public switchTo(state: State<Schemes, K>): void {
        state.setContext(this)
        this.currentState = state
    }

    public drop(context: Context<Schemes, K>) {
        this.currentState.drop(context)
    }
}
