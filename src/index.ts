import { NodeEditor } from 'rete';
import { Plugin } from 'rete/types/core/plugin';
import { renderConnection, renderPathData, updateConnection } from './utils';
import { Picker } from './picker';
import { Flow } from './flow';
import { FlowElement } from './types';
import './events';
import './index.sass';

function install(editor: NodeEditor) {
    editor.bind('connectionpath');
    editor.bind('connectiondrop');
    
    const picker = new Picker(editor);
    const flow = new Flow(picker);
    
    function pointerDown(this: HTMLElement, e: PointerEvent) {
        const { input, output } = (this as any as FlowElement)._reteConnectionPlugin;

        editor.view.container.dispatchEvent(new PointerEvent('pointermove', e));
        e.stopPropagation();
        flow.once({ input, output }, input || output);
    }

    editor.on('rendersocket', ({ el, input, output }) => {
        const flowEl = el as any as FlowElement;
        flowEl._reteConnectionPlugin = { input, output };

        el.removeEventListener('pointerdown', pointerDown);
        el.addEventListener('pointerdown', pointerDown);
    });

    window.addEventListener('pointerup', e => {
        const flowEl = document.elementFromPoint(e.clientX, e.clientY) as FlowElement;
 
        if(picker.io) {
            editor.trigger('connectiondrop', picker.io)
        }
        if(flowEl) {
            flow.act(flowEl._reteConnectionPlugin)
        }
    });

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
} as Plugin
export { defaultPath } from './utils';