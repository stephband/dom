if (!Element.prototype.append) {
    console.warn('A polyfill for Element.append() is needed (https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/append)');
}

export default function append(target, node) {
    target.append(node);
    return node;
}
