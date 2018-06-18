if (!Element.prototype.prepend) {
    console.warn('A polyfill for Element.prepend() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/prepend)');
}

export default function prepend(target, node) {
    target.prepend(node);
    return node;
}
