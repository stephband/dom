/**
identify(node)

Returns the id of `node`, or where `node` has no id, a random id is generated,
checked against the root node (document or shadowRoot) for uniqueness, set on
`node` and returned:

```js
// Get ids of all buttons in document
select('button', document)
.map(identify)
.forEach((id) => ...)
```

This will return useless results if `node` is in a fragment, as root node is
the fragment so ids will not be checked against a document or shadowRoot.
**/

export default function identify(node, prefix = 'id-', root = (node.getRootNode() || document)) {
	let id = node.id;

	if (!id) {
		do { id = prefix + Math.ceil(Math.random() * 1000000); }
		while (root.getElementById(id));
		node.id = id;
	}

	return id;
}
