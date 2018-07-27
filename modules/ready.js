const ready = new Promise(function(accept, reject) {
	function handle() {
		document.removeEventListener('DOMContentLoaded', handle);
		window.removeEventListener('load', handle);
		accept();
	}

	document.addEventListener('DOMContentLoaded', handle);
	window.addEventListener('load', handle);
});

export default ready.then.bind(ready);
