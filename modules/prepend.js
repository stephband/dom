
/**
prepend(target, node)
Prepends `node`, which may be a string or DOM node, to `target`. Returns `node`.
*/

if (!Element.prototype.prepend) {
    throw new Error('A polyfill for Element.prepend() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend)');
}

import curry from '../../fn/modules/curry.js';

export function prepend(target, node) {
    target.prepend(node);
    return target.firstChild;
}

export default curry(prepend, true);
