
/**
toType(node)

Returns one of `'element'`, `'text'`, `'comment'`, `'document'`,
`'doctype'` or `'fragment'`.
**/

var types = {
    1:  'element',
    3:  'text',
    8:  'comment',
    9:  'document',
    10: 'doctype',
    11: 'fragment'
};

export default function toType(node) {
    return types[node.nodeType];
}
