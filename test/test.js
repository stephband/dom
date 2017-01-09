
var log = console.log.bind(console);

function typeWrap(value) {
	var type = typeof value;
	return type === 'string' ? '"' + value + '"' : value ;
}

function equals(expected, value) {
	console.assert(value === expected,
		'expected ' + typeWrap(expected) + ', ' +
		'received ' + typeWrap(value) + '.'
	);
}

function test(name, fn) {
	console.group(name);
	fn();
	console.groupEnd();
}
