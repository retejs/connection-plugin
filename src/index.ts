import { IO, Input, Output, NodeEditor } from 'rete';
import { renderConnection, renderPathData, updateConnection } from './utils';
import { Picker } from './picker';
import './index.sass';

type FlowParams = { input: Input | null, output: Output | null };
interface FlowElement extends Element {
    _reteConnectionPlugin: FlowParams
};

class Flow {

    public picker: Picker;
    public target: IO | null = null;

    constructor(picker: Picker) {
        this.picker = picker;
        this.target = null;
    }

    act({ input, output }: FlowParams = { input: null, output: null }) {
        if (this.unlock(input || output)) return

        if (input)
            this.picker.pickInput(input)
        else if (output)
            this.picker.pickOutput(output)
        else
            this.picker.reset();
    }

    once(params: FlowParams, io: IO) {
        this.act(params);
        this.target = io;
    }

    unlock(io: IO | null) {
        const target = this.target;

        this.target = null;

        return target && target === io;
    }
}

function install(editor: NodeEditor) {
    editor.bind('connectionpath');
    
    const picker = new Picker(editor);
    const flow = new Flow(picker);
    
    editor.on('rendersocket', ({ el, input, output } : { el: FlowElement, input: Input, output: Output }) => {
        el._reteConnectionPlugin = { input, output };

        el.addEventListener('pointerdown', e => {
            editor.view.container.dispatchEvent(new PointerEvent('pointermove', e));
            e.stopPropagation();
            flow.once(el._reteConnectionPlugin, input);
        });
    });

    window.addEventListener('pointerup', e => {
        const el = document.elementFromPoint(e.clientX, e.clientY);

        if(el) {
            flow.act((el as FlowElement)._reteConnectionPlugin)
        }
    });

    editor.on('mousemove', () => picker.updateConnection());

    editor.on('renderconnection', ({ el, connection, points }) => {
        const d = renderPathData(editor, points, connection);

        renderConnection({ el, d, connection })
    });

    editor.on('updateconnection', ({ el, connection, points }) => {
        const d = renderPathData(editor, points, connection);

        updateConnection({ el, d });
    });
}

export default {
    name: 'connection',
    install
}
export { defaultPath } from './utils';