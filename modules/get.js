
/**
get(id)
Returns the node with `id` or `undefined`.
**/

export default function get(id) {
    return document.getElementById(id) || undefined;
}
