/*
fragmentFromHTML(html)
Returns a DOM fragment of the parsed html `string`.
*/

import create from './create.js';

export default function fragmentFromHTML(html, tag) {
    console.warn('fragmentFromHTML() deprecated in favour of create("fragment", html) or create("fragment", { parentNode: context, html })');

    return tag ?
        create('fragment', { parentTag: tag, html: html }) :
        create('fragment', html) ;
}
