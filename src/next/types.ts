import { ClassicPreset as Classic, GetSchemes } from 'rete'

export type Position = { x: number, y: number }
export type SocketData = {
  element: HTMLElement,
  type: 'socket',
  nodeId: string,
  side: 'input' | 'output',
  key: string
}

export type ClassicScheme = GetSchemes<Classic.Node, Classic.Connection<Classic.Node, Classic.Node>>

export type Connection =
    | { type: 'connectionpick' }
    | { type: 'connectiondrop', data: { initial: SocketData } }
