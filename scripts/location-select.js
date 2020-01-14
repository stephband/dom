
import { get, set, overload } from '../../fn/module.js';
import { get as getById, events, matches, trigger } from '../module.js';

const selector = '.location-select';

function isHashRef(ref) {
    return /^#\S+$/.test(ref);
}

events('change', document)
.map(get('target'))
.filter(matches(selector))
.map(get('value'))
.each(overload(isHashRef, {
    true: function(ref) {
        const id = ref.slice(1);
        trigger('dom-activate', getById(id));
    },

    false: set('location', window)
}));
