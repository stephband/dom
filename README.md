#DOM

A library of functional functions, custom events and Event Streams for HTML and SVG.


##Demo and docs

<a href="http://stephband.info/dom/">stephen.band/dom/</a>


##Install

Install `dom`:

    git clone https://github.com/stephband/dom.git
    cd dom/
    npm install

Lint the contents of `js/`:

	npm run lint


## DOM

All functions are curried.

#### Nodes

##### `.isElementNode(node)`
##### `.isTextNode(node)`
##### `.isCommentNode(node)`
##### `.isFragmentNode(node)`

##### `.create(tag, [text])`
##### `.clone(node)`
##### `.tag(node)`
##### `.classes(node)`

Returns the classList of `node`.

##### `.style(property, node)`

Returns the computed style `property` of `node`.

##### `.html(target, html)`
##### `.append(target, node)`
##### `.before(target, node)`
##### `.after(target, node)`
##### `.empty(node)`
##### `.remove(node)`
##### `.matches(selector, node)`
##### `.closest(selector, node)`      

#### Events

##### `.on(node, types, fn, data)`

Binds listener `fn` to events of type `types` on `node`. Listener `fn` is
passed 2 arguments – the event object and optional `data` object:

	function mouse(e, data) {
    	// React to mouse events
    }

	var data = {
		// Some data
	};

    dom.on(node, "mousedown mouseup", mouse, data);

##### `.off(node, types, fn)`

Unbinds listener `fn` from events of type `types` on `node`.

##### `.trigger(node, type, properties)`

Triggers event of `type`, with optional `properties`, on `node`.

##### `.Events(types, node)`

Returns a stream of events heard on `node`.

    var events = dom.Events(document.body, "click");

    events
    .map(function(e) {
        return e.timeStamp();
    })
    .each(function(timeStamp) {
        // Do something with times
    });

Stop the stream:

    events.stop();

##### `.Event(type, properties)`

Returns a DOM event object with properties copied from `properties`.

##### `.isPrimaryButton(e)`

Returns boolean.

##### `.preventDefault(e)`

Calls `e.preventDefault()`.

#### Feature detection

##### `.features`

Returns an object of feature detection results.

## Events

##### `touch`

Requires `js/dom.touch.js`.

A `touch` event fires following a `mousedown` or `touchstart` and as soon as the
pointer has moved more than a threshold 6px from it's start position. It carries
a stream of coordinates for the finger as `e.detail()`.

	dom.on(document, "touch", function(e) {
	    // Position at start of touch
    	var x = e.pageX;
    	var y = e.pageY;
		var time = e.timeStamp;

		// e.detail() creates a stream of touch data for a single
		// finger or pointer
		e.detail().each(function(data) {
			// New coordinate data
			var x = data.x + e.pageX;
			var y = data.y + e.pageY;
			var t = data.time + e.timeStamp;
		});
    });

##### `swipeleft`, `swiperight`, `swipeup`, `swipedown`

Requires `js/dom.touch.js` and `js/dom.swipe.js`.

A swipe event fires after a single touch has performed a swipe gesture in a
node with the class `swipeable`.

	<div class="swipeable">Swipe me</div>

	dom.on(document, "swipeleft", function(e) {
		// e.target === <div class="swipeable">
    });

##History

*0.1*: first import from jquery.event.move and Fn library

##Tweet me

If you use DOM on something interesting, tweet me <a href="http://twitter.com/stephband">@stephband</a>.
