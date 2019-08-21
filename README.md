Rete connection plugin
====
#### Rete.js plugin

Install
---
```js
import ConnectionPlugin from 'rete-connection-plugin';

editor.use(ConnectionPlugin);
```

Events
---

```js
editor.on('connectionpath', data => {
    const {
        points // array of numbers, e.g. [x1, y1, x2, y2]
        connection, // Rete.Connection instance
        d // string, d attribute of <path>
    } = data;

    data.d = `M ${x1} ${y1} ${x2} ${y2}`; // you can override the path curve
});
```

```js
editor.on('connectiondrop', io /* Input or Output */ => {
    // triggered when the user drops picked connection
});
```

```js
editor.on('connectionpick', io /* Input or Output */ => {
    // triggered when the user tries to pick a connection
    // you can prevent it
    return false;
});
```