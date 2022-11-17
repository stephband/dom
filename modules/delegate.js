
/**
delegate(map)

Takes an object map of functions keyed to selectors, and returns a function that
handles event objects, delegating them to the first function whose selector
matches the event target. Functions are passed the target node and the event
object, plus any other arguments passed to the handler.

```
delegate({
	'button': (button, event) => {}
})
```
**/

export default function delegate(object) {
	if (typeof object !== 'object' || arguments.length > 1) {
		throw new Error('delegate() now takes an object of selector:fn pairs.');
	}

	// Create an event handler that looks up the ancestor tree
	// to find selector.
	return function handle(e) {
		const target = e.target;
		let selector;
		for (selector in object) {
			const node = target.closest(selector);
			if (node) {
				return object[selector](node, ...arguments);
			}
		}
	};
}
