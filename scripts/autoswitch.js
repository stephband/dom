
import '../js/dom.switchable.js';
import '../js/dom.swipeable.js';
import { get, weakCache } from '../../fn/fn.js';
import { children, events, matches, trigger } from '../dom.js';

const config    = { duration: 6 };
const getData   = weakCache(() => ({}));
const getTarget = get('target');

function triggerNext(block) {
    const data  = getData(block);
	const timer = data.timer;
	const next  = children(block).find(matches('.active.switchable, .active[switchable]')).nextElementSibling;

	clearTimeout(timer);
	data.timer = true;

	trigger('dom-activate', next);
}

function activate(switchable) {
    const block    = switchable.parentNode;
    const duration = switchable.getAttribute('data-duration') || config.duration;
    const data     = getData(block);

	clearTimeout(data.timer);
	if (data.timer !== false) {
		data.timer = setTimeout(triggerNext, parseFloat(duration) * 1000, block);
	}
}

events('dom-activate', document)
.map(getTarget)
.filter(matches('.autoswitch > .switchable'))
.each(activate);
