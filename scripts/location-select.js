
import { get } from '../../fn/fn.js';
import { events, matches } from '../dom.js';

events('change', document)
.map(get('target'))
.filter(matches('.location-select'))
.map(get('value'))
.each(function(value) {
    window.location = value;
});
