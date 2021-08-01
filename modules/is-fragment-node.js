/**
isFragmentNode(node)

Returns `true` if `node` is a fragment.
**/

export default function isFragmentNode(node) {
    return node.nodeType === 11;
}
