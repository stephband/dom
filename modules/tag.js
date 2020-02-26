
/**
tag(node)

Returns the tag name of `node`, in lowercase.

```
const li = create('li', 'Salt and vinegar');
tag(li);   // 'li'
```
*/

export default function tag(node) {
	return node.tagName && node.tagName.toLowerCase();
}
