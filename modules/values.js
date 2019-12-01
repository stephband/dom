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


export const toPx = overload(toType, {
	'number': id,

	'string': function(string) {
		var data = runit.exec(string);

		if (data) {
			return units[data[2]](parseFloat(data[1]));
		}

		throw new Error('dom: "' + string + '" cannot be parsed as rem, em, vw or vh units.');
	}
});

export function toRem(n) {
	return (toPx(n) / getFontSize()) + 'rem';
}

export function toVw(n) {
	return (100 * toPx(n) / window.innerWidth) + 'vw';
}

export function toVh(n) {
	return (100 * toPx(n) / window.innerHeight) + 'vh';
}
