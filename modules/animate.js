
// animate(duration, transform, value, name, object)
//
// duration  - in seconds
// transform - function that maps x (0-1) to y (0-1)
// name      - name of property to animate
// object    - object to animate
// value     - target value

import { denormalise_, pipe, set } from '../../fn/fn.js';
import transition from './transition.js';

export default function animate(duration, transform, name, object, value) {
	console.log('linear', 0, object[name], value);
	return transition(
		duration,
		pipe(transform, denormalise_('linear', object[name], value), set(name, object))
	);
}
