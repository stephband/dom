

/*
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
```
*/

import { pipe, set } from '../../fn/module.js';
import { linear as denormaliseLinear } from '../../fn/modules/denormalisers.js';
import transition from './transition.js';

export default function animate(duration, transform, name, object, value) {
	// denormaliseLinear is not curried! Wrap it.
    const startValue = object[name];
	return transition(
		duration,
		pipe(transform, (v) => denormaliseLinear(startValue, value, v), set(name, object))
	);
}
