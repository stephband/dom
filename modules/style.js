/**
style(property, node)

Returns the computed style `property` of `node`.
    style('transform', node);  // returns transform
*/

import parseAngle from '../../fn/modules/parse-angle.js';

var rpx    = /px$/;
var rangle = /deg$|turn$|rad$/;

function computedStyle(name, node) {
	return window.getComputedStyle ?
		window
		.getComputedStyle(node, null)
		.getPropertyValue(name) :
		0 ;
}

export default function style(name, node) {
    var value = computedStyle(name, node);

    // Pixel values are converted to number type
    return typeof value === 'string' ?
		rpx.test(value) ? parseFloat(value) :
		rangle.test(value) ? parseAngle(value) :
        value :
		value ;
}
