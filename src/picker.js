import { renderConnection } from './utils';

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
        if (val !== null)
            area.appendChild(this.el);
        else if (this.el.parentElement) {
            area.removeChild(this.el);
            this.el.innerHTML = '';
        }
    }

    renderConnection({ x, y }, renderType, curvature) {
        if (!this.output) return;
    
        const node = this.editor.view.nodes.get(this.output.node);
        const [x1, y1] = node.getSocketPosition(this.output);

        renderConnection({ el: this.el, x1, y1, x2: x, y2: y, connection: null }, renderType, curvature);
    }

}