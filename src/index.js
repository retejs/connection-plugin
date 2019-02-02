import './index.sass'
import { renderConnection, renderPathData, updateConnection } from './utils';
import { Picker } from './picker';

class Flow {
    constructor(picker) {
        this.picker = picker;
        this.locked = false;
    }

    act({ input, output } = {}) {
        if (this.locked) return;
        
        if (input)
            this.picker.pickInput(input)
        else if (output)
            this.picker.pickOutput(output)
        else
            this.picker.reset();
    }

    once(params) {
        this.act(params);
        this.prevent();
    }

    prevent() {
        this.locked = true;
    }

    reset() {
        this.locked = false;
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
            flow.once(el._reteConnectionPlugin);
        });
        el.addEventListener('click', e => {
            e.stopPropagation();
            flow.reset();
        });
    });

    window.addEventListener('pointerup', e => {
        const el = document.elementFromPoint(e.clientX, e.clientY);

        flow.act(el && el._reteConnectionPlugin)
    });
    window.addEventListener('pointermove', () => flow.reset());

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