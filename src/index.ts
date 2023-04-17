import { CanAssignSignal, NodeEditor, Root, Scope } from 'rete'
import { Area2D, Area2DInherited, AreaPlugin } from 'rete-area-plugin'

import { Flow } from './flow'
import { EventType } from './flow/base'
import { createPseudoconnection } from './pseudoconnection'
import { ClassicScheme, Connection, Preset, SocketData } from './types'
import { findSocket } from './utils'

export * from './flow'
export * as Presets from './presets'
export type { Connection, Preset, Side, SocketData } from './types'

export type ExpectArea2DExtra = { type: 'render', data: SocketData }

type IsCompatible<K> = Extract<K, { type: 'render' }> extends { type: 'render', data: infer P } ? CanAssignSignal<P, SocketData> : false // TODO should add type: 'render' ??
type Substitute<K> = IsCompatible<K> extends true ? K : ExpectArea2DExtra

export class ConnectionPlugin<Schemes extends ClassicScheme, K = never> extends Scope<
    Connection,
    Area2DInherited<Schemes, Substitute<K>>
> {
  presets: Preset<Schemes>[] = []
  private areaPlugin!: AreaPlugin<Schemes>
  private editor!: NodeEditor<Schemes>
  private currentFlow: Flow<Schemes, any[]> | null = null
  private preudoconnection = createPseudoconnection()
  private socketsCache = new Map<Element, SocketData>()

  constructor() {
    super('connection')
  }

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

  // eslint-disable-next-line max-statements
  pick(event: PointerEvent, type: EventType) {
    const flowContext = { editor: this.editor, scope: this, socketsCache: this.socketsCache }
    const pointedElements = document.elementsFromPoint(event.clientX, event.clientY)
    const pickedSocket = findSocket(this.socketsCache, pointedElements)

    event.preventDefault()
    event.stopPropagation()

    if (pickedSocket) {
      this.currentFlow = this.currentFlow || this.findPreset(pickedSocket)

      if (this.currentFlow) {
        this.currentFlow.pick({ socket: pickedSocket, event: type }, flowContext)
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

  setParent(scope: Scope<Substitute<K> | Area2D<Schemes>, [Root<Schemes>]>): void {
    super.setParent(scope)
    this.areaPlugin = this.parentScope<AreaPlugin<Schemes>>(AreaPlugin)
    this.editor = this.areaPlugin.parentScope<NodeEditor<Schemes>>(NodeEditor)

    const pointerdownSocket = (e: PointerEvent) => {
      this.pick(e, 'down')
    }

    // eslint-disable-next-line max-statements
    this.addPipe(context => {
      if (!('type' in context)) return context

      if (context.type === 'pointermove') {
        this.update()
      } else if (context.type === 'pointerup') {
        this.pick(context.data.event, 'up')
      } else if (context.type === 'render') {
        const withExtra = context as (typeof context) | ExpectArea2DExtra // inject extra type

        if (withExtra.data.type === 'socket') {
          const { element } = withExtra.data

          element.addEventListener('pointerdown', pointerdownSocket)
          this.socketsCache.set(element, withExtra.data)
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
