

/**
animate(duration, transform, name, object, value)

Animates property `name` of `object` to `value` over `duration` seconds, using
the `transform` function as an easing function, and updates the object on
animation frames.

```
duration  - number in seconds
transform - function that maps x (0-1) to y (0-1)
name      - string name of property to animate
object    - object to animate
value     - target value
fn        - optional function to call on completion
```
*/

import pipe        from '../../fn/modules/pipe.js';
import denormalise from '../../fn/modules/denormalise.js';
import transition  from './transition.js';

export default function animate(duration, transform, name, object, stopValue, fn) {
	// denormaliseLinear is not curried! Wrap it.
    const startValue = object[name];
	return transition(
		duration,
		pipe(transform, (progress) => denormalise(startValue, stopValue, progress), (value) => (object[name] = value)),
		fn
	);
}
