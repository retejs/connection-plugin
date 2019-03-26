import { NodeEditor } from 'rete';
import { Plugin } from 'rete/types/core/plugin';
import { renderConnection, renderPathData, updateConnection } from './utils';
import { Picker } from './picker';
import { Flow } from './flow';
import { FlowElement } from './types';
import './index.sass';

function install(editor: NodeEditor) {
    editor.bind('connectionpath');
    
    const picker = new Picker(editor);
    const flow = new Flow(picker);
    
    editor.on('rendersocket', ({ el, input, output }) => {
        const flowEl = el as any as FlowElement;
        flowEl._reteConnectionPlugin = { input, output };

        el.addEventListener('pointerdown', e => {
            editor.view.container.dispatchEvent(new PointerEvent('pointermove', e));
            e.stopPropagation();
            flow.once(flowEl._reteConnectionPlugin, input);
        });
    });

    window.addEventListener('pointerup', e => {
        const el = document.elementFromPoint(e.clientX, e.clientY);

        if(el) {
            flow.act((el as FlowElement)._reteConnectionPlugin)
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