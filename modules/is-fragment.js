/**
isFragment(node)
Returns `true` if `node` is a fragment.
**/

export default function isFragment(node) {
    return node.nodeType === 11;
}
