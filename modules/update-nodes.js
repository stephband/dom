/**
updateNodes(values, parent, node, createNode, isNodeOfValue, isRemovable)

Scans forward through child nodes of parent starting with node (where given),
checking for children that correspond to objects. Where a mismatch is found
`createNode(value)` is called, and the returned node is inserted. Any
mismatching nodes left after all objects are checked are removed, up until
`isRemoveable(node)` is falsy.
**/

function returnTrue() {
    return true;
}

export default function updateNodes(values, parent, node = parent.firstNode, createNode, isNodeOfValue, isRemoveable = returnTrue) {
    // Generate nodes for inserted objects
    let n = -1;
    let value, later;

    loop: while (value = values[++n]) {
        if (node) {
            // Node matches object
            if (isNodeOfValue(node, value)) {
                node = node.nextSibling;
                continue loop;
            }

            // A node later down the DOM matches object. Slightly expensive
            // I imagine but better then having to create an entirely new node
            later = node;
            while ((later = later.nextSibling) && isRemoveable(later)) if (isNodeOfValue(later, value)) {
                // Bring it forward
                parent.insertBefore(later, node);
                // Jump out to outer loop
                continue loop;
            }
        }

        // Insert new node created from object
        parent.insertBefore(createNode(value), node);
    }

    // Remove unmatching trailing nodes up until we run out of removeable nodes
    while (node && isRemoveable(node)) {
        n = node.nextSibling;
        node.remove();
        node = n;
    }
}
