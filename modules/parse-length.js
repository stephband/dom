// Units

import id         from '../../fn/modules/id.js';
import overload   from '../../fn/modules/overload.js';
import toType     from '../../fn/modules/to-type.js';
import parseValue from '../../fn/modules/parse-value.js';
import style      from './style.js';


/* Track document font size */

let fontSize;

function getFontSize() {
    return fontSize ||
        (fontSize = style("font-size", document.documentElement));
}

window.addEventListener('resize', () => fontSize = undefined);

/**
px(value)
Takes a number in pixels or a string of the form `'10px'`, `'10em'`, `'10rem'`, 
`'100vw'` or `'100vh'`, and returns a numeric value in pixels.
*/

export const px = overload(toType, {
    'number': id,

    'string': parseValue({
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

export default px;

/**
em(value)
Takes numeric value in px, or CSS length of the form `'10px'`, and returns 
a numeric value in `em`, eg. `0.625`. Depends on the `font-size` of the document 
root at render time.
*/

/**
rem(value)
Takes numeric value in px, or CSS length of the form `'10px'`, and returns 
a numeric value in `rem`, eg. `0.625`. Depends on the `font-size` of the 
document root at render time.
*/

export function rem(n) {
    return px(n) / getFontSize();
}

export const em = rem;

/**
vw(value)
Takes number in pixels or CSS length of the form `'10em'` and returns a 
numeric value in `vw`, eg. `120`. Depends on the width of the viewport at 
render time.
*/

export function vw(n) {
    return (100 * px(n) / window.innerWidth);
}

/**
vh(value)
Takes number in pixels or CSS length of the form `'10em'` and returns a 
numeric value in `vh`, eg. `120`. Depends on the height of the viewport at 
render time.
*/

export function vh(n) {
    return (100 * px(n) / window.innerHeight);
}
