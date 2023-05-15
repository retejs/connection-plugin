import { ClassicScheme, SocketData } from '../../types'
import { Context, Flow, PickParams } from '../base'
import { makeConnection as defaultMakeConnection, State, StateContext } from '../utils'

export type BidirectParams<Schemes extends ClassicScheme> = {
  pickByClick: boolean
  makeConnection: <K extends any[]>(from: SocketData, to: SocketData, context: Context<Schemes, K>) => boolean | undefined
}

class Picked<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(public initial: SocketData, private params: BidirectParams<Schemes>) {
    super()
  }

  async pick({ socket }: PickParams, context: Context<Schemes, K>): Promise<void> {
    if (this.params.makeConnection(this.initial, socket, context)) {
      this.drop(context, socket, true)
    } else if (!this.params.pickByClick) {
      this.drop(context, socket)
    }
  }

  drop(context: Context<ClassicScheme, K>, socket: SocketData | null = null, created = false): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial, socket, created } })
    }
    this.context.switchTo(new Idle<Schemes, K>(this.params))
  }
}

class Idle<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(private params: BidirectParams<Schemes>) {
    super()
  }

  async pick({ socket, event }: PickParams, context: Context<Schemes, K>): Promise<void> {
    if (event === 'down') {
      if (await context.scope.emit({ type: 'connectionpick', data: { socket } })) {
        this.context.switchTo(new Picked(socket, this.params))
      } else {
        this.drop(context)
      }
    }
  }

  drop(context: Context<Schemes, K>, socket: SocketData | null = null, created = false): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial, socket, created } })
    }
    delete this.initial
  }
}

export class BidirectFlow<Schemes extends ClassicScheme, K extends any[]> implements StateContext<Schemes, K>, Flow<Schemes, K> {
  currentState!: State<Schemes, K>

  constructor(params?: Partial<BidirectParams<Schemes>>) {
    const pickByClick = Boolean(params?.pickByClick)
    const makeConnection = params?.makeConnection || defaultMakeConnection

    this.switchTo(new Idle({ pickByClick, makeConnection }))
  }

  public async pick(params: PickParams, context: Context<Schemes, K>) {
    this.currentState.pick(params, context)
  }

  public getPickedSocket() {
    return this.currentState.initial
  }

  public drop(context: Context<Schemes, K>) {
    this.currentState.drop(context)
  }

  public switchTo(state: State<Schemes, K>): void {
    state.setContext(this)
    this.currentState = state
  }
}
