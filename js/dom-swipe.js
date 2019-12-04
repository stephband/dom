import { argument, toPolar } from '../../fn/module.js';
import { closest, events } from '../module.js';
import './dom-gesture.js';

const on      = events.on;
const trigger = events.trigger;

//    var settings = {
//        // Ratio of distance over target finger must travel to be
//        // considered a swipe.
//        threshold: 0.4,
//        // Faster fingers can travel shorter distances to be considered
//        // swipes. 'sensitivity' controls how much. Bigger is shorter.
//        sensitivity: 6
//    };

function touchdone(node, first, last) {
	//var x = data.x;
	//var y = data.y;
	//var w = node.offsetWidth;
	//var h = node.offsetHeight;
	var polar = toPolar([last.pageX - first.pageX, last.pageY - first.pageY]);

	// Todo: check if swipe has enough velocity and distance
	//x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1

	trigger(node, 'dom-swipe', {
		detail:   last,
		angle:    polar[1],
		velocity: polar[0] / (last.timeStamp - first.timeStamp)
	});
}

on(document, 'dom-gesture', function(e) {
	// Event is already handled
	if (e.defaultPrevented) { return; }

	var node = closest('.swipeable, [swipeable]', e.target);
	if (!node) { return; }

	// e.detail is a stream of touch or mouse events
	e
    .detail()
	.last((last) => touchdone(node, e, last));
});
