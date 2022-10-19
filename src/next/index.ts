import { BaseSchemes, Root, Scope } from 'rete'

console.log('connection')

export type Connection = { type: 'connectionpick' }

export class ConnectionPlugin<Schemes extends BaseSchemes> extends Scope<Connection, Root<Schemes>> {
    constructor() {
        super('connection')
    }
}
