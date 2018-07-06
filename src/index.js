import './index.sass'
import { Picker } from './picker';
import { renderConnection } from './utils';

export function install(editor, { curvature = 0.4 }) {
    var mousePosition = [0, 0];
    var picker = new Picker(editor)

    function pickOutput({ output, node }) {
        if (output) {
            picker.output = output;
            return;
        }
    }

    function pickInput({ input, node }) {
        if (picker.output === null) {
            if (input.hasConnection()) {
                picker.output = input.connections[0].output;
                editor.removeConnection(input.connections[0]);
                picker.renderConnection(mousePosition, curvature);
            }
            return true;
        }

        if (!input.multipleConnections && input.hasConnection())
            editor.removeConnection(input.connections[0]);
        
        if (!picker.output.multipleConnections && picker.output.hasConnection())
            editor.removeConnection(picker.output.connections[0]);
        
        if (picker.output.connectedTo(input)) {
            var connection = input.connections.find(c => c.output === picker.output);

            editor.removeConnection(connection);
        }

        editor.connect(picker.output, input);
        picker.output = null
    }

    editor.on('rendersocket', ({ el, input, output, socket }) => {

        var prevent = false;

        function mouseHandle(e) {
            if (prevent) return;
            e.stopPropagation();
            e.preventDefault();
            
            if (input)
                pickInput({ input, socket })
            else if (output)
                pickOutput({ output, socket })
        }

        el.addEventListener('mousedown', e => (mouseHandle(e), prevent = true));
        el.addEventListener('mouseup', mouseHandle);
        el.addEventListener('click', e => (mouseHandle(e), prevent = false));
        el.addEventListener('mousemove', () => (prevent = false));
    });

    editor.on('mousemove', arg => { mousePosition = arg; picker.renderConnection(mousePosition, curvature) });

    editor.on('click', () => { picker.output = null; });

    editor.on('renderconnection', arg => renderConnection(arg, curvature));
}