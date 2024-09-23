/**
isComment(node)
Returns `true` if `node` is a comment.
**/

export default function isComment(node) {
    return node.nodeType === 8;
}
