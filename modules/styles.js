/** 
styles(selectors, node)

Appends a style element to `node` containing rules for each selector in 
the comma-delineated string `selectors`. Returns an array containing a style 
object for each selector.

```js
const [host, slot] = styles(':host, slot', shadowRoot);
```
**/

export default function styles(selectors, node) {
    const rules = selectors.split(/\s*,\s*/);
    const css   = rules.join(' {} ') + ' {}';
    const style = create('style', css);
    // Style objects can only be got at after css is appended
    node.appendChild(style);
    return rules.map((rule, i) => style.sheet.cssRules[i].style);
}
