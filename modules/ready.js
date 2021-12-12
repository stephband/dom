/**
ready(fn)
Calls `fn` on DOM content load, or if later than content load, immediately
(on the next tick).
*/

console.log('READYABLE');

const ready = new Promise(function(accept, reject) {
	function handle(e) {
		document.removeEventListener('DOMContentLoaded', handle);
		window.removeEventListener('load', handle);
		//accept(e);
	}

	document.addEventListener('DOMContentLoaded', handle);
	window.addEventListener('load', handle);
});

export default ready.then.bind(c);
