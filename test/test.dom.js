
console.group('Testing dom...');

var EventStream = DOM.EventStream;

test('EventStream(node, "click")', function() {
	var node = document.querySelector('button');

	EventStream(node, 'click').pull(function(e) {
		console.log('listened ', e);
	});

	EventStream(document.body, 'click', '.delegate').pull(function(e) {
		console.log('delegated', e);
	});
});

console.groupEnd();
