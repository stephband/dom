
console.warn('dom/modules/parse-value.js is deprecated in favour of parse-length.js (which returns numbers not strings, so watch out.)');

// Units

import id       from '../../fn/modules/id.js';
import overload from '../../fn/modules/overload.js';
import toType   from '../../fn/modules/to-type.js';
import parseVal from '../../fn/modules/parse-value.js';
import events   from './events.js';
import style    from './style.js';


/* Track document font size */

let fontSize;

function getFontSize() {
    return fontSize ||
        (fontSize = style("font-size", document.documentElement));
}

events('resize', window).each(() => fontSize = undefined);


/**
parseValue(value)
Takes a string of the form '10px', '10em', '10rem', '100vw' or '100vh' and 
returns a number in pixels. If `value` is a number it is returned directly.
*/

const parseValue = overload(toType, {
    'number': id,

    'string': parseVal({
        em: function(n) {
            return getFontSize() * n;
        },

        px: function(n) {
            return n;
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
    })
});

export default parseValue;

/**
px(value)
Takes number in pixels or a CSS value as a string and returns a string
of the form '10.25px'.
*/

export function px(n) {
    return parseValue(n) + 'px';
}

/**
rem(value)
Takes number in pixels or a CSS value as a string and returns a string
of the form '10.25rem'.
*/

export function rem(n) {
    return (parseValue(n) / getFontSize())
        // Chrome needs min 7 digit precision for accurate rendering
        .toFixed(8)
        // Remove trailing 0s
        .replace(/\.?0*$/, '')
        // Postfix
        + 'rem';
}

// Deprecated (name changed)
export const toRem = rem;

/**
toVw(value)
Takes number in pixels and returns a string of the form '10vw'.
*/

export function vw(n) {
    return (100 * parseValue(n) / window.innerWidth) + 'vw';
}

// Deprecated (name changed)
export const toVw = vw;

/**
toVh(value)
Takes number in pixels and returns a string of the form '10vh'.
*/

export function vh(n) {
    return (100 * parseValue(n) / window.innerHeight) + 'vh';
}

// Deprecated (name changed)
export const toVh = vh;
