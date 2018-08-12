
// transition(duration, fn)
//
// duration  - duration seconds
// fn        - callback that is called on animation frames with a float
//             representing progress in the range 0-1
//
// Returns a function that cancels the transition.

const performance           = window.performance;
const requestAnimationFrame = window.requestAnimationFrame;
const cancelAnimationFrame  = window.cancelAnimationFrame;

export default function transition(duration, fn) {
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
		}
	}

	var id = requestAnimationFrame(frame);

	return function cancel() {
		cancelAnimationFrame(id);
	};
};
