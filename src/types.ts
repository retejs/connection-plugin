import { ClassicPreset as Classic, GetSchemes } from 'rete'

import { Flow } from './flow'

export type Position = { x: number, y: number }
export type Side = 'input' | 'output'
export type SocketData = {
  element: HTMLElement,
  type: 'socket',
  nodeId: string,
  side: Side,
  key: string,
  // wrongField: true
}

export type ConnectionExtra = {
  isPseudo?: boolean
}

export type ClassicScheme = GetSchemes<
  Classic.Node,
  Classic.Connection<Classic.Node, Classic.Node> & ConnectionExtra
>

export type Connection =
    | { type: 'connectionpick' }
    | { type: 'connectiondrop', data: { initial: SocketData } }

export type Preset<Schemes extends ClassicScheme> = (data: SocketData) => Flow<Schemes, any[]> | undefined
