/**
isElement(node)
Returns `true` if `node` is an element node.
**/

export default function isElement(node) {
    return node.nodeType === 1;
}
