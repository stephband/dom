var rpx          = /px$/;
var styleParsers = {
	"transform:translateX": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		return parseFloat(values[4]);
	},

	"transform:translateY": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		return parseFloat(values[5]);
	},

	"transform:scale": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		var a = parseFloat(values[0]);
		var b = parseFloat(values[1]);
		return Math.sqrt(a * a + b * b);
	},

	"transform:rotate": function(node) {
		var matrix = computedStyle('transform', node);
		if (!matrix || matrix === "none") { return 0; }
		var values = valuesFromCssFn(matrix);
		var a = parseFloat(values[0]);
		var b = parseFloat(values[1]);
		return Math.atan2(b, a);
	}
};

function valuesFromCssFn(string) {
	return string.split('(')[1].split(')')[0].split(/\s*,\s*/);
}

function computedStyle(name, node) {
	return window.getComputedStyle ?
		window
		.getComputedStyle(node, null)
		.getPropertyValue(name) :
		0 ;
}

export default function style(name, node) {
    // If name corresponds to a custom property name in styleParsers...
    if (styleParsers[name]) { return styleParsers[name](node); }

    var value = computedStyle(name, node);

    // Pixel values are converted to number type
    return typeof value === 'string' && rpx.test(value) ?
        parseFloat(value) :
        value ;
}
