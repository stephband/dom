/*
identify(node)

Returns the id of `node`, or where `node` has no id, a random id is generated,
checked against the DOM for uniqueness, set on `node` and returned:

```
query('button', document)
.map(identify)
.forEach((id) => ...)
```
*/

export default function identify(node) {
	var id = node.id;

	if (!id) {
		do { id = Math.ceil(Math.random() * 100000); }
		while (document.getElementById(id));
		node.id = id;
	}

	return id;
}
