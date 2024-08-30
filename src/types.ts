import { ClassicPreset as Classic, GetSchemes } from 'rete'

import { Flow } from './flow'

export type Position = { x: number, y: number }
export type Side = 'input' | 'output'
export type SocketData = {
  element: HTMLElement
  type: 'socket'
  nodeId: string
  side: Side
  key: string
  // wrongField: true
}

export type ConnectionExtra = {
  isPseudo?: boolean
}

export type ClassicScheme = GetSchemes<
  Classic.Node,
  Classic.Connection<Classic.Node, Classic.Node> & ConnectionExtra
>

/**
 * Signal types produced by ConnectionPlugin instance
 * @priority 10
 */
export type Connection =
  | { type: 'connectionpick', data: { socket: SocketData } }
  | { type: 'connectiondrop', data: { initial: SocketData, socket: SocketData | null, created: boolean } }

export type Preset<Schemes extends ClassicScheme> = (data: SocketData) => Flow<Schemes, any[]> | undefined
