import './index.sass'
import { Picker } from './picker';
import { defaultPath, renderConnection, renderPathData, updateConnection } from './utils';

function install(editor) {
    editor.bind('connectionpath');
    
    var picker = new Picker(editor)

    function pickOutput(output) {
        if (output) {
            picker.output = output;
            return;
        }
    }

    function pickInput(input) {
        if (picker.output === null) {
            if (input.hasConnection()) {
                picker.output = input.connections[0].output;
                editor.removeConnection(input.connections[0]);
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

    function pickConnection(connection) {
        const { output } = connection;

        editor.removeConnection(connection);
        picker.output = output;
    }

    editor.on('rendersocket', ({ el, input, output }) => {

        var prevent = false;

        function mouseHandle(e) {
            if (prevent) return;
            e.stopPropagation();
            e.preventDefault();
            
            if (input)
                pickInput(input)
            else if (output)
                pickOutput(output)
        }

        el.addEventListener('mousedown', e => (mouseHandle(e), prevent = true));
        el.addEventListener('mouseup', mouseHandle);
        el.addEventListener('click', e => (mouseHandle(e), prevent = false));
        el.addEventListener('mousemove', () => (prevent = false));
    });

    editor.on('mousemove', () => { picker.updateConnection() });

    editor.view.container.addEventListener('mousedown', () => { 
        picker.output = null;
    });

    editor.on('renderconnection', ({ el, connection, points }) => {
        const d = renderPathData(editor, points, connection);

        el.addEventListener('contextmenu', e => {
            e.stopPropagation();
            e.preventDefault();
            
            pickConnection(connection)
        });

        renderConnection({ el, d, connection })
    });

    editor.on('updateconnection', ({ el, connection, points }) => {
        const d = renderPathData(editor, points, connection);

        updateConnection({ el, connection, d });
    });
}

export default {
    install,
    defaultPath
}