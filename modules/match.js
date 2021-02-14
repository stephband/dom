console.error('Deprecated: Use delegate(), not match().')

export default function match(fn, options) {
	var key;
	return function(e) {
		const node = fn.apply(null, arguments);
		var target;

		for (key in options) {
			target = node.closest(key);
			if (target) {
				e.delegateTarget = target;
				return options[key].apply(this, arguments);
			}
		}
	};
}
