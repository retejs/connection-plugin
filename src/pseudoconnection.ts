import { getUID } from 'rete'
import { BaseArea, BaseAreaPlugin } from 'rete-area-plugin'

import { ClassicScheme, Position, SocketData } from './types'

/**
 * Create pseudoconnection. Used to trigger rendering of connection that is being created by user.
 * Has additional `isPseudo` property in payload.
 * @param extra Extra payload to add to connection
 */
export function createPseudoconnection<Schemes extends ClassicScheme, K>(extra?: Partial<Schemes['Connection']>) {
  let element: HTMLElement | null = null
  let id: string | null = null

  function unmount(areaPlugin: BaseAreaPlugin<Schemes, BaseArea<Schemes> | K>) {
    if (id) {
      areaPlugin.removeConnectionView(id)
    }
    element = null
    id = null
  }
  function mount(areaPlugin: BaseAreaPlugin<Schemes, BaseArea<Schemes> | K>) {
    unmount(areaPlugin)
    id = `pseudo_${getUID()}`
  }

  return {
    isMounted() {
      return Boolean(id)
    },
    mount,
    render(areaPlugin: BaseAreaPlugin<Schemes, BaseArea<Schemes> | K>, { x, y }: Position, data: SocketData) {
      const isOutput = data.side === 'output'
      const pointer = {
        x: x + (isOutput
          ? -3
          : 3),
        y
      } // fix hover of underlying elements

      if (!id) throw new Error('pseudo connection id wasn\'t generated')

      const payload = isOutput
        ? {
          id,
          source: data.nodeId,
          sourceOutput: data.key,
          target: '',
          targetInput: '',
          ...extra ?? {}
        }
        : {
          id,
          target: data.nodeId,
          targetInput: data.key,
          source: '',
          sourceOutput: '',
          ...extra ?? {}
        }

      if (!element) {
        const view = areaPlugin.addConnectionView(payload)

        element = view.element
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!element) return

      void areaPlugin.emit({
        type: 'render',
        data: {
          element,
          type: 'connection',
          payload,
          ...isOutput
            ? { end: pointer }
            : { start: pointer }
        }
      })
    },
    unmount
  }
}
