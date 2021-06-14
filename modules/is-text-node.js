
/**
isTextNode(node)
Returns `true` if `node` is a text node.
**/

export default function isTextNode(node) {
    return node.nodeType === 3;
}
