
/*
tag(node)

Returns the tag name of `node`.

```
const li = create('li', 'Salt and vinegar');
tag(li);   // 'li'
```
*/

export default function tag(node) {
	return node.tagName && node.tagName.toLowerCase();
}
