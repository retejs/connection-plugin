function toTrainCase(str) {
    return str.toLowerCase().replace(/ /g, '-');
}

export function renderConnection({ el, x1, y1, x2, y2, connection }, curvature) {
    const hx1 = x1 + Math.abs(x2 - x1) * curvature;
    const hx2 = x2 - Math.abs(x2 - x1) * curvature;
    const classed = !connection?[]:[
        'input-' + toTrainCase(connection.input.name),
        'output-' + toTrainCase(connection.output.name),
        'socket-input-' + toTrainCase(connection.input.socket.name),
        'socket-output-' + toTrainCase(connection.output.socket.name)
    ];

    el.innerHTML = `<svg class="connection ${classed.join(' ')}">
        <path d="M ${x1} ${y1} C ${hx1} ${y1} ${hx2} ${y2} ${x2} ${y2}"/>
    </svg>`;
}