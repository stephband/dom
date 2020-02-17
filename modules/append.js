/*
append(target, node)

Appends `node`, which may be a string or DOM node, to `target`. Returns `node`.
*/

if (!Element.prototype.append) {
    throw new Error('A polyfill for Element.append() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append)');
}

import { curry } from '../../fn/module.js';

export function append(target, node) {
    target.append(node);
    return target.lastChild;
}

export default curry(append, true);
