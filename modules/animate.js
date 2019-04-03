
// animate(duration, transform, value, name, object)
//
// duration  - in seconds
// transform - function that maps x (0-1) to y (0-1)
// name      - name of property to animate
// object    - object to animate
// value     - target value

import { pipe, set } from '../../fn/module.js';
import { linear as denormaliseLinear } from '../../fn/modules/denormalisers.js';
import transition from './transition.js';

export default function animate(duration, transform, name, object, value) {
	return transition(
		duration,
		pipe(transform, denormaliseLinear(object[name], value), set(name, object))
	);
};
