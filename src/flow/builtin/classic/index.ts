
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

  async pick({ socket }: PickParams, context: Context<Schemes, K>): Promise<void> {
    if (this.params.canMakeConnection(this.initial, socket)) {
      syncConnections([this.initial, socket], context.editor).commit()
      const created = this.params.makeConnection(this.initial, socket, context)

      this.drop(context, created ? socket : null, created)
    }
  }

  drop(context: Context<Schemes, K>, socket: SocketData | null = null, created = false): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial, socket, created } })
    }
    this.context.switchTo(new Idle(this.params))
  }
}

class PickedExisting<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  initial!: SocketData
  outputSocket: SocketData

  constructor(public connection: Schemes['Connection'], private params: ClassicParams<Schemes>, context: Context<Schemes, K>) {
    super()
    const outputSocket = Array.from(context.socketsCache.values()).find(data => {
      return data.nodeId === this.connection.source
        && data.side === 'output'
        && data.key === this.connection.sourceOutput
    })

    if (!outputSocket) throw new Error('cannot find output socket')

    this.outputSocket = outputSocket
  }

  async init(context: Context<Schemes, K>) {
    context.scope.emit({ type: 'connectionpick', data: { socket: this.outputSocket } }).then(response => {
      if (response) {
        context.editor.removeConnection(this.connection.id)
        this.initial = this.outputSocket
      } else {
        this.drop(context)
      }
    })
  }

  async pick({ socket, event }: PickParams, context: Context<Schemes, K>): Promise<void> {
    if (this.initial && !(socket.side === 'input' && this.connection.target === socket.nodeId && this.connection.targetInput === socket.key)) {
      if (this.params.canMakeConnection(this.initial, socket)) {
        syncConnections([this.initial, socket], context.editor).commit()
        const created = this.params.makeConnection(this.initial, socket, context)

        this.drop(context, created ? socket : null, created)
      }
    } else if (event === 'down') {
      if (this.initial) {
        syncConnections([this.initial, socket], context.editor).commit()
        const created = this.params.makeConnection(this.initial, socket, context)

        this.drop(context, created ? socket : null, created)
      }
    }
  }

  drop(context: Context<Schemes, K>, socket: SocketData | null = null, created = false): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial, socket, created } })
    }
    this.context.switchTo(new Idle<Schemes, K>(this.params))
  }
}

class Idle<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(private params: ClassicParams<Schemes>) {
    super()
  }

  async pick({ socket, event }: PickParams, context: Context<Schemes, K>): Promise<void> {
    if (event !== 'down') return
    if (socket.side === 'input') {
      const connection = context
        .editor.getConnections()
        .find(item => item.target === socket.nodeId && item.targetInput === socket.key)

      if (connection) {
        const state = new PickedExisting(connection, this.params, context)

        await state.init(context)
        this.context.switchTo(state)
        return
      }
    }

    if (await context.scope.emit({ type: 'connectionpick', data: { socket } })) {
      this.context.switchTo(new Picked(socket, this.params))
    } else {
      this.drop(context)
    }
  }

  drop(context: Context<Schemes, K>, socket: SocketData | null = null, created = false): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial, socket, created } })
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

  public async pick(params: PickParams, context: Context<Schemes, K>) {
    await this.currentState.pick(params, context)
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
