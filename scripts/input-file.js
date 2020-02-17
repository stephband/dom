
/*
Detects changes on file inputs, updates corresponding labels with a
data-file attribute containing the name (not the path) of the file.
*/

import { get } from '../../fn/module.js';
import { events, matches, select } from '../module.js';

const selector = '[type="file"]';

events('change', document)
.map(get('target'))
.filter(matches(selector))
.each(function(input) {
    const value = input.value;
    const id    = input.id;
    const name  = /[^/\\]+$/.exec(value)[0];

    select('[for="' + id + '"]', document).forEach((label) => {
        label.setAttribute('data-file', name);
    });
});
