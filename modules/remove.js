/**
remove(node)

Removes `node` from the DOM.
*/

export default function remove(node) {
    node.remove();
    return node;
}
