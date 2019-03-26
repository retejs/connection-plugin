
import { FlowParams } from './flow';
import { Connection } from 'rete';
export interface FlowElement extends Element {
    _reteConnectionPlugin: FlowParams
};

declare module 'rete/types/events' {
    interface EventsTypes {
        connectionpath: {
            points: number[],
            connection: Connection,
            d: string
        }
    }
}