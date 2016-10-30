(function(window) {
	"use strict";

	var DOM = window.DOM;

	var on      = DOM.on;
	var off     = DOM.off;
	var trigger = DOM.trigger;
	var closest = DOM.closest;

	var settings = {
		// Ratio of distance over target finger must travel to be
		// considered a swipe.
		threshold: 0.4,
		// Faster fingers can travel shorter distances to be considered
		// swipes. 'sensitivity' controls how much. Bigger is shorter.
		sensitivity: 6
	};

	function touchdone(node, touch) {
		var e = touch.last().shift();
		var x = e.x;
		var y = e.y;
		var w = node.offsetWidth;
		var h = node.offsetHeight;

		// Find out which of the four directions was swiped
		if (x > y) {
			if (x > -y) {
				if (x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1) {
					trigger(node, 'swiperight');
				}
			}
			else {
				if (-y/h > settings.threshold || e.velocityY * y/w * settings.sensitivity > 1) {
					trigger(node, 'swipeup');
				}
			}
		}
		else {
			if (x > -y) {
				if (y/h > settings.threshold || e.velocityY * y/w * settings.sensitivity > 1) {
					trigger(node, 'swipedown');
				}
			}
			else {
				if (-x/w > settings.threshold || e.velocityX * x/w * settings.sensitivity > 1) {
					trigger(node, 'swipeleft');
				}
			}
		}
	}

	on(document, 'touch', function(e) {
		if (e.defaultPrevented) { return; }

		var swipeable = closest('.swipeable', e.target);

		if (!swipeable) { return; }

		var touch = e.detail();

		touch.on('done', function() {
			touchdone(swipeable, touch);
		});
	});

})(this);