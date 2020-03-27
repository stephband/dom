// Units

import { id, overload, toType } from '../../fn/module.js';
import style from './style.js';

const runit = /(\d*\.?\d+)(r?em|vw|vh)/;
//var rpercent = /(\d*\.?\d+)%/;

const units = {
	em: function(n) {
		return getFontSize() * n;
	},

	rem: function(n) {
		return getFontSize() * n;
	},

	vw: function(n) {
		return window.innerWidth * n / 100;
	},

	vh: function(n) {
		return window.innerHeight * n / 100;
	}
};

let fontSize;

function getFontSize() {
	return fontSize ||
		(fontSize = style("font-size", document.documentElement), 10);
}

/**
parseValue(value)`

Takes a string of the form '10rem', '100vw' or '100vh' and returns a number in pixels.
*/

export const parseValue = overload(toType, {
	'number': id,

	'string': function(string) {
		var data = runit.exec(string);

		if (data) {
			return units[data[2]](parseFloat(data[1]));
		}

		throw new Error('dom: "' + string + '" cannot be parsed as rem, em, vw or vh units.');
	}
});


/**
toRem(value)

Takes number in pixels and returns a string of the form '10rem'.
*/

export function toRem(n) {
	return (parseValue(n) / getFontSize()) + 'rem';
}

/**
toVw(value)

Takes number in pixels and returns a string of the form '10vw'.
*/

export function toVw(n) {
	return (100 * parseValue(n) / window.innerWidth) + 'vw';
}

/**
toVh(value)

Takes number in pixels and returns a string of the form '10vh'.
*/

export function toVh(n) {
	return (100 * parseValue(n) / window.innerHeight) + 'vh';
}
