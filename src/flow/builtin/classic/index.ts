
import { ClassicScheme, SocketData } from '../../../types'
import { Context, Flow, PickParams } from '../../base'
import {
  canMakeConnection as defaultCanMakeConnection, makeConnection as defaultMakeConnection, State, StateContext
} from '../../utils'
import { syncConnections } from './sync-connections'

export type ClassicParams<Schemes extends ClassicScheme> = {
  canMakeConnection: (from: SocketData, to: SocketData) => boolean | undefined
  makeConnection: <K extends any[]>(from: SocketData, to: SocketData, context: Context<Schemes, K>) => boolean | undefined
}

class Picked<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(public initial: SocketData, private params: ClassicParams<Schemes>) {
    super()
  }

  pick({ socket }: PickParams, context: Context<Schemes, K>): void {
    if (this.params.canMakeConnection(this.initial, socket)) {
      syncConnections([this.initial, socket], context.editor).commit()
      this.params.makeConnection(this.initial, socket, context)
      this.drop(context)
    }
  }

  drop(context: Context<Schemes, K>): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
    }
    this.context.switchTo(new Idle(this.params))
  }
}

class PickedExisting<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  initial!: SocketData

  constructor(public connection: Schemes['Connection'], private params: ClassicParams<Schemes>, context: Context<Schemes, K>) {
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

  pick({ socket, event }: PickParams, context: Context<Schemes, K>): void {
    if (this.initial && !(socket.side === 'input' && this.connection.target === socket.nodeId && this.connection.targetInput === socket.key)) {
      if (this.params.canMakeConnection(this.initial, socket)) {
        syncConnections([this.initial, socket], context.editor).commit()
        this.params.makeConnection(this.initial, socket, context)
        this.drop(context)
      }
    } else if (event === 'down') {
      if (this.initial) {
        syncConnections([this.initial, socket], context.editor).commit()
        this.params.makeConnection(this.initial, socket, context)
        this.drop(context)
      }
    }
  }

  drop(context: Context<Schemes, K>): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
    }
    this.context.switchTo(new Idle<Schemes, K>(this.params))
  }
}

class Idle<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(private params: ClassicParams<Schemes>) {
    super()
  }

  pick({ socket, event }: PickParams, context: Context<Schemes, K>): void {
    if (event !== 'down') return
    if (socket.side === 'input') {
      const connection = context
        .editor.getConnections()
        .find(item => item.target === socket.nodeId && item.targetInput === socket.key)

      if (connection) {
        this.context.switchTo(new PickedExisting(connection, this.params, context))
        return
      }
    }

    this.context.switchTo(new Picked(socket, this.params))
  }

  drop(context: Context<Schemes, K>): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
    }
    delete this.initial
  }
}

export class ClassicFlow<Schemes extends ClassicScheme, K extends any[]> implements StateContext<Schemes, K>, Flow<Schemes, K> {
  currentState!: State<Schemes, K>

  constructor(params?: Partial<ClassicParams<Schemes>>) {
    const canMakeConnection = params?.canMakeConnection || defaultCanMakeConnection
    const makeConnection = params?.makeConnection || defaultMakeConnection

    this.switchTo(new Idle<Schemes, K>({ canMakeConnection, makeConnection }))
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
