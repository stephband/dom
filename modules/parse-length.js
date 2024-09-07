// Units

import id         from 'fn/id.js';
import overload   from 'fn/overload.js';
import toType     from 'fn/to-type.js';
import parseValue from 'fn/parse-value.js';
import style      from './style.js';


/* Track document font size */

let emSize;
let remSize;

function getEmSize() {
    if (!emSize) {
        if (window.DEBUG) {
            console.warn('Calculating root em value may cause reflow as user font-size cannot be known without setting <html style="font-size: 100%;">');
        }

        const styledFontSize = document.documentElement.style.fontSize;
        document.documentElement.style.fontSize = '100%';
        emSize = style("font-size", document.documentElement);
        document.documentElement.style.fontSize = styledFontSize || '';
    }

    return emSize;
}

function getRemSize() {
    if (!remSize) {
        remSize = style("font-size", document.documentElement);
    }

    return remSize;
}

window.addEventListener('resize', () => {
    emSize  = undefined;
    remSize = undefined;
});

/**
px(value)
Takes a number in pixels or a string of the form `'10px'`, `'10em'`, `'10rem'`,
`'100vw'`, `'100vh'`, `'100vmin'` or `'100vmax'`, and returns a numeric value
in pixels.
*/

export const px = overload(toType, {
    'number': id,

    'string': parseValue({
        px:   id,
        em:   (n) => getEmSize() * n,
        rem:  (n) => getRemSize() * n,
        vw:   (n) => window.innerWidth * n / 100,
        vh:   (n) => window.innerHeight * n / 100,

        vmin: (n) => (
            window.innerWidth < window.innerHeight ?
                window.innerWidth * n / 100 :
                window.innerHeight * n / 100
        ),

        vmax: (n) => (
            window.innerWidth < window.innerHeight ?
                window.innerHeight * n / 100 :
                window.innerWidth * n / 100
        )
    })
});

export default px;

/**
em(value)
Takes numeric value in px, or CSS length of the form `'10px'`, and returns
a numeric value in `em`, eg. `0.625`. Depends on the user defined browser
`font-size`.
*/

export function em(n) {
    return px(n) / getEmSize();
}

/**
rem(value)
Takes numeric value in px, or CSS length of the form `'10px'`, and returns
a numeric value in `rem`, eg. `0.625`. Depends on the `font-size` of the
documentElement.
*/

export function rem(n) {
    return px(n) / getRemSize();
}

/**
vw(value)
Takes number in pixels or CSS length of the form `'10em'` and returns a
numeric value in `vw`, eg. `120`. Depends on the width of the viewport at
render time.
*/

export function vw(n) {
    return 100 * px(n) / window.innerWidth;
}

/**
vh(value)
Takes number in pixels or CSS length of the form `'10em'` and returns a
numeric value in `vh`, eg. `120`. Depends on the height of the viewport at
render time.
*/

export function vh(n) {
    return 100 * px(n) / window.innerHeight;
}

/**
vmin(value)
Takes number in pixels or CSS length of the form `'10em'` and returns a
numeric value in `vmin`, eg. `120`. Depends on the minimum dimension of the
viewport at render time.
*/

export function vmin(n) {
    return 100 * px(n) / (
        window.innerWidth < window.innerHeight ?
            window.innerWidth :
            window.innerHeight
    );
}

/**
vmax(value)
Takes number in pixels or CSS length of the form `'10em'` and returns a
numeric value in `vmax`, eg. `120`. Depends on the maximum dimension of the
viewport at render time.
*/

export function vmax(n) {
    return 100 * px(n) / (
        window.innerWidth < window.innerHeight ?
            window.innerHeight :
            window.innerWidth
    );
}
