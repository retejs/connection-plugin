import { NodeEditor, Input, Output, Connection } from 'rete';
import { renderConnection, renderPathData, updateConnection } from './utils';

export class Picker {

    private el: HTMLElement;
    private editor: NodeEditor;
    private _output: Output | null = null;

    constructor(editor: NodeEditor) {
        this.el = document.createElement('div');
        this.editor = editor;
    }

    get output() : Output | null {
        return this._output;
    }

    set output(val) {
        const { area } = this.editor.view;

        this._output = val;
        if (val !== null) {
            area.appendChild(this.el);
            this.renderConnection();
        } else if (this.el.parentElement) {
            area.removeChild(this.el)
            this.el.innerHTML = '';
        }
    }

    reset() {
        this.output = null;
    }

    pickOutput(output: Output) {
        if (this.output) this.reset();
        
        this.output = output;
    }

    // eslint-disable-next-line max-statements
    pickInput(input: Input) {
        if (this.output === null) {
            if (input.hasConnection()) {
                this.output = input.connections[0].output;
                this.editor.removeConnection(input.connections[0]);
            }
            return true;
        }

        if (!input.multipleConnections && input.hasConnection())
            this.editor.removeConnection(input.connections[0]);
        
        if (!this.output.multipleConnections && this.output.hasConnection())
            this.editor.removeConnection(this.output.connections[0]);
        
        if (this.output.connectedTo(input)) {
            let connection = input.connections.find(c => c.output === this.output);

            if(connection) {
                this.editor.removeConnection(connection);
            }
        }

        this.editor.connect(this.output, input);
        this.reset();
    }

    pickConnection(connection: Connection) {
        const { output } = connection;

        this.editor.removeConnection(connection);
        this.output = output;
    }

    private getPoints(output: Output): number[] {
        const mouse = this.editor.view.area.mouse;

        if(!output.node) throw new Error('Node in output not found')
    
        const node = this.editor.view.nodes.get(output.node);

        if(!node) throw new Error('Node view not found')
    
        const [x1, y1] = node.getSocketPosition(output);

        return [x1, y1, mouse.x, mouse.y];
    }

    updateConnection() {
        if (!this.output) return;

        const d = renderPathData(this.editor, this.getPoints(this.output));

        updateConnection({ el: this.el, d });
    }

    renderConnection() {
        if (!this.output) return;

        const d = renderPathData(this.editor, this.getPoints(this.output));

        renderConnection({ el: this.el, d });
    }

}