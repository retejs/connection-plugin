import Path from "svg-path-generator";

const renderTypeCurved = 'curved';
const renderTypeRightAngled = 'right-angled';

function toTrainCase(str) {
    return str.toLowerCase().replace(/ /g, '-');
}

function getClasses(connection) {
    return !connection?[]:[
        'input-' + toTrainCase(connection.input.name),
        'output-' + toTrainCase(connection.output.name),
        'socket-input-' + toTrainCase(connection.input.socket.name),
        'socket-output-' + toTrainCase(connection.output.socket.name)
    ];
}

function renderCurvedConnection({ el, x1, y1, x2, y2, connection }, curvature) {
    const hx1 = x1 + Math.abs(x2 - x1) * curvature;
    const hx2 = x2 - Math.abs(x2 - x1) * curvature;
    const classes = getClasses(connection);

    el.innerHTML = `<svg class="connection ${classes.join(' ')}">
        <path d="M ${x1} ${y1} C ${hx1} ${y1} ${hx2} ${y2} ${x2} ${y2}"/>
    </svg>`;
}

function renderRightAngleConnection({ el, x1, y1, x2, y2, connection }) {
    const widthDifference = x2 - x1;

    const path = Path()
        .moveTo(x1, y1)
        .relative().horizontalLineTo(widthDifference / 2)
        .verticalLineTo(y2)
        .horizontalLineTo(x2)
        .end();

    const classes = getClasses(connection);

    el.innerHTML = `<svg class="connection ${classes.join(' ')}">
        <path d="${path}"/>
    </svg>`;
}

export function renderConnection({ el, x1, y1, x2, y2, connection }, renderType, curvature) {
    if (renderType === renderTypeRightAngled) {
        return renderRightAngleConnection({ el, x1, y1, x2, y2, connection });
    } else if (renderType === renderTypeCurved) {
        return renderCurvedConnection({el, x1, y1, x2, y2, connection}, curvature);
    }

    throw 'unknown-render-type';
}

export {renderTypeCurved, renderTypeRightAngled};
