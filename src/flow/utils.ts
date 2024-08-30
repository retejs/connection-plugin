import { getUID } from 'rete'

import { ClassicScheme, SocketData } from '../types'
import { Context, PickParams } from './base'

export interface StateContext<Schemes extends ClassicScheme, K extends any[]> {
  currentState: State<Schemes, K>
  switchTo(state: State<Schemes, K>): void
}

export abstract class State<Schemes extends ClassicScheme, K extends any[]> {
  context!: StateContext<Schemes, K>
  initial: SocketData | undefined

  setContext(context: StateContext<Schemes, K>) {
    this.context = context
  }

  abstract pick(params: PickParams, context: Context<Schemes, K>): Promise<void>
  abstract drop(context: Context<Schemes, K>): void
}

export function getSourceTarget(initial: SocketData, socket: SocketData) {
  const forward = initial.side === 'output' && socket.side === 'input'
  const backward = initial.side === 'input' && socket.side === 'output'
  const [source, target] = forward
    ? [initial, socket]
    : backward
      ? [socket, initial]
      : []

  if (source && target) return [source, target]
}

export function canMakeConnection(initial: SocketData, socket: SocketData) {
  return Boolean(getSourceTarget(initial, socket))
}

export function makeConnection<Schemes extends ClassicScheme, K extends any[]>(initial: SocketData, socket: SocketData, context: Context<Schemes, K>) {
  const [source, target] = getSourceTarget(initial, socket) || [null, null]

  if (source && target) {
    void context.editor.addConnection({
      id: getUID(),
      source: source.nodeId,
      sourceOutput: source.key,
      target: target.nodeId,
      targetInput: target.key
    })
    return true
  }
}
