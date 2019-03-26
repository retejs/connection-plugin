import { NodeEditor, Input, Output, Connection } from 'rete';
import { renderConnection, renderPathData, updateConnection } from './utils';

export class Picker {

    private el: HTMLElement;
    private editor: NodeEditor;
    private _io: Output | Input | null = null;

    constructor(editor: NodeEditor) {
        this.el = document.createElement('div');
        this.editor = editor;
    }

    get io() : Output | Input | null {
        return this._io;
    }

    set io(val) {
        const { area } = this.editor.view;

        this._io = val;
        if (val !== null) {
            area.appendChild(this.el);
            this.renderConnection();
        } else if (this.el.parentElement) {
            area.removeChild(this.el)
            this.el.innerHTML = '';
        }
    }

    reset() {
        this.io = null;
    }

    pickOutput(output: Output) {
        if (this.io instanceof Input) {
            if(!output.multipleConnections && output.hasConnection())
                this.editor.removeConnection(output.connections[0])
    
            this.editor.connect(output, this.io);
            this.reset();
            return;
        }

        if (this.io) this.reset();
        this.io = output;
    }

    pickInput(input: Input) {
        if (this.io === null) {
            if (input.hasConnection()) {
                this.io = input.connections[0].output;
                this.editor.removeConnection(input.connections[0]);
            } else {
                this.io = input;
            }
            return true;
        }

        if (!input.multipleConnections && input.hasConnection())
            this.editor.removeConnection(input.connections[0]);
        
        if (!this.io.multipleConnections && this.io.hasConnection())
            this.editor.removeConnection(this.io.connections[0]);
        
        if (this.io instanceof Output && this.io.connectedTo(input)) {
            let connection = input.connections.find(c => c.output === this.io);

            if(connection) {
                this.editor.removeConnection(connection);
            }
        }

        if(this.io instanceof Output) {
            this.editor.connect(this.io, input);
            this.reset();
        }
    }

    pickConnection(connection: Connection) {
        const { output } = connection;

        this.editor.removeConnection(connection);
        this.io = output;
    }

    private getPoints(io: Output | Input): number[] {
        const mouse = this.editor.view.area.mouse;

        if(!io.node) throw new Error('Node in output/input not found')
    
        const node = this.editor.view.nodes.get(io.node);

        if(!node) throw new Error('Node view not found')
    
        const [x1, y1] = node.getSocketPosition(io);

        return io instanceof Output
            ? [x1, y1, mouse.x, mouse.y]
            : [mouse.x, mouse.y, x1, y1];
    }

    updateConnection() {
        if (!this.io) return;

        const d = renderPathData(this.editor, this.getPoints(this.io));

        updateConnection({ el: this.el, d });
    }

    renderConnection() {
        if (!this.io) return;

        const d = renderPathData(this.editor, this.getPoints(this.io));

        renderConnection({ el: this.el, d });
    }

}