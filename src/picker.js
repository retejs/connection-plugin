import { renderConnection, renderPathData, updateConnection } from './utils';

export class Picker {

    constructor(editor) {
        this.el = document.createElement('div');
        this.editor = editor;
        this._output = null;
    }

    get output() {
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

    pickOutput(output) {
        if (output && !this.output) {
            this.output = output;
        }
    }

    // eslint-disable-next-line max-statements
    pickInput(input) {
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
            var connection = input.connections.find(c => c.output === this.output);

            this.editor.removeConnection(connection);
        }

        this.editor.connect(this.output, input);
        this.reset();
    }

    pickConnection(connection) {
        const { output } = connection;

        this.editor.removeConnection(connection);
        this.output = output;
    }

    getPoints() {
        const mouse = this.editor.view.area.mouse;
        const node = this.editor.view.nodes.get(this.output.node);
        const [x1, y1] = node.getSocketPosition(this.output);

        return [x1, y1, mouse.x, mouse.y];
    }

    updateConnection() {
        if (!this.output) return;

        const d = renderPathData(this.editor, this.getPoints());

        updateConnection({ el: this.el, d });
    }

    renderConnection() {
        if (!this.output) return;

        const d = renderPathData(this.editor, this.getPoints());

        renderConnection({ el: this.el, d, connection: null });
    }

}