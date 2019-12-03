import { argument, toPolar } from '../../fn/module.js';
import { closest, events } from '../module.js';
import './dom-gesture.js';

const on      = events.on;
const trigger = events.trigger;

//	var settings = {
//		// Ratio of distance over target finger must travel to be
//		// considered a swipe.
//		threshold: 0.4,
//		// Faster fingers can travel shorter distances to be considered
//		// swipes. 'sensitivity' controls how much. Bigger is shorter.
//		sensitivity: 6
//	};

function touchdone(node, data, x0, y0, t0) {
	//var x = data.x;
	//var y = data.y;
	//var w = node.offsetWidth;
	//var h = node.offsetHeight;
	var polar = toPolar([data.pageX - x0, data.pageY - y0]);

	// Todo: check if swipe has enough velocity and distance
	//x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1

	trigger(node, 'dom-swipe', {
		detail:   data,
		angle:    polar[1],
		velocity: polar[0] / (data.timeStamp - t0)
	});
}

on(document, 'dom-gesture', function(e) {
	if (e.defaultPrevented) { return; }

	var node = closest('.swipeable, [swipeable]', e.target);
	if (!node) { return; }

	var touch = e.detail();

    touch
    .clone()
    .reduce(argument(1))
    .then((data) => touchdone(node, data, e.pageX, e.pageY, e.timeStamp));
});
