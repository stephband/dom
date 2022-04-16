

/**
transition(duration, fn)

Calls `fn` on each animation frame until `duration` seconds has elapsed. `fn`
is passed a single argument `progress`, a number that ramps from `0` to `1` over
the duration of the transition. Returns a function that cancels the transition.

```
transition(3, function(progress) {
    // Called every frame for 3 seconds
});
```
*/

const performance           = window.performance;
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame  = window.cancelAnimationFrame;

export default function transition(duration, fn, end) {
	var t0 = performance.now();

	function frame(t1) {
		// Progress from 0-1
		var progress = (t1 - t0) / (duration * 1000);

		if (progress < 1) {
			if (progress > 0) {
				fn(progress);
			}
			id = requestAnimationFrame(frame);
		}
		else {
			fn(1);
			end && end();
		}
	}

	var id = requestAnimationFrame(frame);

	return function cancel() {
		cancelAnimationFrame(id);
	};
}
