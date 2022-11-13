import { NodeEditor } from 'rete'

import { ClassicScheme, SocketData } from '../../../types'

function findPort<Schemes extends ClassicScheme>(socket: SocketData, editor: NodeEditor<Schemes>) {
    const node = editor.getNode(socket.nodeId)

    if (!node) throw new Error('cannot find node')

    const list = socket.side === 'input' ? node.inputs : node.outputs

    return list[socket.key]
}
function findConnections<Schemes extends ClassicScheme>(socket: SocketData, editor: NodeEditor<Schemes>) {
    const { nodeId, side, key } = socket

    return editor.getConnections().filter(connection => {
        if (side === 'input') {
            return connection.target === nodeId && connection.targetInput === key
        }
        if (side === 'output') {
            return connection.source === nodeId && connection.sourceOutput === key
        }
    })
}

/**
 * Remove existing connections if Port doesnt allow multiple connections
 */
export function syncConnections<Schemes extends ClassicScheme>(sockets: SocketData[], editor: NodeEditor<Schemes>) {
    const connections: Schemes['Connection'][] = sockets.map(socket => {
        const port = findPort(socket, editor)
        const multiple = port?.multipleConnections

        if (multiple) return []

        return findConnections(socket, editor)
    }).flat()

    return {
        commit() {
            const uniqueIds = Array.from(new Set(connections.map(({ id }) => id)))

            uniqueIds.forEach(id => editor.removeConnection(id))
        }
    }
}
