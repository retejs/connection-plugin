import { NodeEditor, Scope } from 'rete'
import { BaseArea, BaseAreaPlugin, RenderSignal } from 'rete-area-plugin'

import { Flow } from './flow'
import { EventType } from './flow/base'
import { createPseudoconnection } from './pseudoconnection'
import { ClassicScheme, Connection, Position, Preset, Side, SocketData } from './types'
import { elementsFromPoint, findSocket } from './utils'

export * from './flow'
export * as Presets from './presets'
export { createPseudoconnection } from './pseudoconnection'
export type { Connection, ConnectionExtra, Preset, Side, SocketData } from './types'

type Requires =
  | { type: 'pointermove', data: { position: Position, event: PointerEvent } }
  | { type: 'pointerup', data: { position: Position, event: PointerEvent } }
  | RenderSignal<'socket', {
    nodeId: string
    side: Side
    key: string
  }>
  | { type: 'unmount', data: { element: HTMLElement } }

/**
 * Connection plugin. Responsible for user interaction with connections (creation, deletion)
 * @priority 9
 * @emits connectionpick
 * @emits connectiondrop
 * @listens pointermove
 * @listens pointerup
 * @listens render
 * @listens unmount
 */
export class ConnectionPlugin<Schemes extends ClassicScheme, K = Requires> extends Scope<Connection, [Requires | K]> {
  presets: Preset<Schemes>[] = []
  private areaPlugin!: BaseAreaPlugin<Schemes, BaseArea<Schemes>>
  private editor!: NodeEditor<Schemes>
  private currentFlow: Flow<Schemes, any[]> | null = null
  private preudoconnection = createPseudoconnection({ isPseudo: true })
  private socketsCache = new Map<Element, SocketData>()

  constructor() {
    super('connection')
  }

  /**
   * Add preset to the plugin
   * @param preset Preset to add
   */
  public addPreset(preset: Preset<Schemes>) {
    this.presets.push(preset)
  }

  private findPreset(data: SocketData) {
    for (const preset of this.presets) {
      const flow = preset(data)

      if (flow) return flow
    }
    return null
  }

  update() {
    if (!this.currentFlow) return
    const socket = this.currentFlow.getPickedSocket()

    if (socket) {
      this.preudoconnection.render(this.areaPlugin, this.areaPlugin.area.pointer, socket)
    }
  }

  /**
   * Drop pseudo-connection if exists
   * @emits connectiondrop
   */
  drop() {
    const flowContext = { editor: this.editor, scope: this, socketsCache: this.socketsCache }

    if (this.currentFlow) {
      this.currentFlow.drop(flowContext)
      this.preudoconnection.unmount(this.areaPlugin)
      this.currentFlow = null
    }
  }

  // eslint-disable-next-line max-statements
  async pick(event: PointerEvent, type: EventType) {
    const flowContext = { editor: this.editor, scope: this, socketsCache: this.socketsCache }
    const pointedElements = elementsFromPoint(event.clientX, event.clientY)
    const pickedSocket = findSocket(this.socketsCache, pointedElements)

    if (pickedSocket) {
      event.preventDefault()
      event.stopPropagation()
      this.currentFlow = this.currentFlow || this.findPreset(pickedSocket)

      if (this.currentFlow) {
        await this.currentFlow.pick({ socket: pickedSocket, event: type }, flowContext)
        this.preudoconnection.mount(this.areaPlugin)
      }
    } else if (this.currentFlow) {
      this.currentFlow.drop(flowContext)
    }
    if (this.currentFlow && !this.currentFlow.getPickedSocket()) {
      this.preudoconnection.unmount(this.areaPlugin)
      this.currentFlow = null
    }
    this.update()
  }

  setParent(scope: Scope<Requires | K>): void {
    super.setParent(scope)
    this.areaPlugin = this.parentScope<BaseAreaPlugin<Schemes, BaseArea<Schemes>>>(BaseAreaPlugin)
    this.editor = this.areaPlugin.parentScope<NodeEditor<Schemes>>(NodeEditor)

    const pointerdownSocket = (e: PointerEvent) => {
      void this.pick(e, 'down')
    }

    this.addPipe(context => {
      if (!context || typeof context !== 'object' || !('type' in context)) return context

      if (context.type === 'pointermove') {
        this.update()
      } else if (context.type === 'pointerup') {
        void this.pick(context.data.event, 'up')
      } else if (context.type === 'render') {
        if (context.data.type === 'socket') {
          const { element } = context.data

          element.addEventListener('pointerdown', pointerdownSocket)
          this.socketsCache.set(element, context.data)
        }
      } else if (context.type === 'unmount') {
        const { element } = context.data

        element.removeEventListener('pointerdown', pointerdownSocket)
        this.socketsCache.delete(element)
      }
      return context
    })
  }
}
