import { ClassicScheme, SocketData } from '../../types'
import { Context, Flow, PickParams } from '../base'
import { makeConnection, State, StateContext } from '../utils'

class Picked<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(public initial: SocketData, private pickByClick: boolean) {
    super()
  }

  pick({ socket }: PickParams, context: Context<Schemes, K>): void {
    if (makeConnection(this.initial, socket, context)) {
      this.drop(context)
    } else if (!this.pickByClick) {
      this.drop(context)
    }
  }

  drop(context: Context<ClassicScheme, K>): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
    }
    this.context.switchTo(new Idle<Schemes, K>(this.pickByClick))
  }
}

class Idle<Schemes extends ClassicScheme, K extends any[]> extends State<Schemes, K> {
  constructor(private pickByClick: boolean) {
    super()
  }

  pick({ socket, event }: PickParams): void {
    if (event === 'down') {
      this.context.switchTo(new Picked(socket, this.pickByClick))
    }
  }

  drop(context: Context<Schemes, K>): void {
    if (this.initial) {
      context.scope.emit({ type: 'connectiondrop', data: { initial: this.initial } })
    }
    delete this.initial
  }
}

export class BidirectFlow<Schemes extends ClassicScheme, K extends any[]> implements StateContext<Schemes, K>, Flow<Schemes, K> {
  currentState!: State<Schemes, K>

  constructor(props?: { pickByClick?: boolean }) {
    this.switchTo(new Idle(Boolean(props?.pickByClick)))
  }

  public pick(params: PickParams, context: Context<Schemes, K>) {
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
