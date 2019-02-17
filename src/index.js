import './index.sass'
import { renderConnection, renderPathData, updateConnection } from './utils';
import { Picker } from './picker';

class Flow {
    constructor(picker) {
        this.picker = picker;
        this.target = null;
    }

    act(params) {
        const { input, output } = params || {};

        if (this.unlock(input || output)) return

        if (input)
            this.picker.pickInput(input)
        else if (output)
            this.picker.pickOutput(output)
        else
            this.picker.reset();
    }

    once(params, io) {
        this.act(params);
        this.target = io;
    }

    unlock(io) {
        const target = this.target;

        this.target = null;

        return target && target === io;
    }
}

function install(editor) {
    editor.bind('connectionpath');
    
    const picker = new Picker(editor);
    const flow = new Flow(picker);
    
    editor.on('rendersocket', ({ el, input, output }) => {
        el._reteConnectionPlugin = { input, output };

        el.addEventListener('pointerdown', e => {
            editor.view.container.dispatchEvent(new PointerEvent('pointermove', e));
            e.stopPropagation();
            flow.once(el._reteConnectionPlugin, input);
        });
    });

    window.addEventListener('pointerup', e => {
        const el = document.elementFromPoint(e.clientX, e.clientY);

        flow.act(el && el._reteConnectionPlugin)
    });

    editor.on('mousemove', () => picker.updateConnection());

    editor.on('renderconnection', ({ el, connection, points }) => {
        const d = renderPathData(editor, points, connection);

        el.addEventListener('contextmenu', e => {
            e.stopPropagation();
            e.preventDefault();
            
            picker.pickConnection(connection);
        });

        renderConnection({ el, d, connection })
    });

    editor.on('updateconnection', ({ el, connection, points }) => {
        const d = renderPathData(editor, points, connection);

        updateConnection({ el, connection, d });
    });
}

export default {
    name: 'connection',
    install
}
export { defaultPath } from './utils';