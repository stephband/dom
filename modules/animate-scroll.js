
// animateScroll(coords)
//
// Animate scrollTop of scrollingElement to coords [x, y]

import { denormalise, normalise, pipe, pow } from '../../fn/fn.js';
import transition from './transition.js';

var view = document.scrollingElement;

export default function animateScroll(coords) {
	var duration = 0.6;
	var ease = pow(2);

	// coords may be a single y value or a an [x, y] array
	var x, y;

	if (typeof coords === "number") {
		x = false;
		y = coords;
	}
	else {
		x = coords[0];
		y = coords[1];
	}

	var denormaliseX = x !== false && denormalise(view.scrollLeft, x);
	var denormaliseY = denormalise(view.scrollTop, y);

	return transition(
		duration,
		pipe(ease, function(progress) {
			x !== false && (view.scrollLeft = denormaliseX(progress));
			view.scrollTop  = denormaliseY(progress);
		})
	);
};
