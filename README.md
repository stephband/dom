# dom.js

A library of curried DOM functions, custom events and event streams
for HTML and SVG.

## Demo and docs

<a href="http://stephband.info/dom/">stephen.band/dom/</a>

## dom(selector)

##### `dom(selector)`

Returns a functor - a mappable iterable. To log all urls in links:

    dom('a[href]')
	.map(dom.get('href'))
	.each(console.log);

To consume the functor as an array:

    var urls = dom('a[href]')
        .map(dom.get('href'))
        .toArray();

It can be looped over with `for...of`. Here's an equivalent using a loop:

	var links = dom('a[href]');
	var link;

	for (link of links) {
		console.log(link.href);
	}

##### `dom(nodes)`

`dom()` also accepts a collection of nodes.

	var children = dom(document.body.childNodes);

## dom

All functions on `dom` are curried functions. Many are designed to be used
as map or filter functions.

	// Collect all links with or containing `.my-icon` and
	// stick them in a fragment.

	var fragment = dom.create('fragment');

    dom('.my-icon')
    .map(dom.closest('a'))
    .each(dom.append(fragment));

##### `.create(tag, text)`

Returns a new node.

- If `tag` is `"text"` returns a text node with the content `text`.
- If `tag` is `"fragment"` returns a document fragment.
- If `tag` is `"comment"` returns a comment `<!-- text -->`.
- Anything else returns an element `<tag>text</tag>`, where `text` is inserted
  as html.

##### `.clone(node)`

Returns a deep copy of `node`.

##### `.isElementNode(node)`

Return `true` if `node` is an element node.

##### `.isTextNode(node)`

Return `true` if `node` is a text node.

##### `.isCommentNode(node)`

Return `true` if `node` is a comment.

##### `.isFragmentNode(node)`

Return `true` if `node` is a fragment.

##### `.isExternalLink(node)`

Return `true` if the `href` of `node` points outside of the current domain.

##### `.identify(node)`

Returns the id of `node`, or where there is no id a random id is generated,
set on `node` and returned.

    dom('button')
    .map(dom.identify)
    ...

If you just want to get the id, us `Fn.get`.

    dom('button')
    .map(dom.get('id'))
    ...

##### `.tag(node)`

Returns the tag name of `node`.

##### `.attribute(name, node)`

Returns the string contents of attribute `name`, or if the attribute is boolean,
returns `true` or `false`.

##### `.classes(node)`

Returns the classList of `node`.

//##### `.html(target, html)`
//
//Replaces the content of `target` with `html`.

##### `.append(target, node)`

Appends node to `target`.

If `node` is a collection of nodes, appends each node to `target`.

##### `.before(target, node)`

Inserts `node` before target.

##### `.after(target, node)`

Inserts `node` after `target`.

##### `.empty(node)`

Removes content of `node`.

##### `.remove(node)`

Removes `node` from the DOM.

##### `.matches(selector, node)`

Returns `true` if `node` matches `selector`, otherwise `false`.

##### `.closest(selector, node)`

Returns the node itself, or the closest ancestor to match `selector`.

#### Style

##### `.style(property, node)`

Returns the computed style `property` of `node`.
If `property` is of the form `"property:name"`, a named aspect of the property
is returned.

    dom.style('transform:rotate', node);     // returns rotation, as a number, in radians
    dom.style('transform:scale', node);      // returns scale, as a number
    dom.style('transform:translateX', node); // returns translation, as a number, in px
    dom.style('transform:translateY', node); // returns tranlsation, as a number, in px

##### `.offset(node)`

Returns array [x, y].

##### `.position(node)`

Returns array [x, y].

#### Events

##### `.Event(type, properties)`

Creates a custom event of `type`. Properties are assigned to the event object.

##### `.events(types, node)`

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

##### `.events.on(node, types, fn, data)`

Binds listener `fn` to events of type `types` on `node`. Listener `fn` is
passed 2 arguments – the event object and optional `data` object:

	function mouse(e, data) {
    	// React to mouse events
    }

	var data = {
		// Some data
	};

    dom.on(node, "mousedown mouseup", mouse, data);

##### `.events.off(node, types, fn)`

Unbinds listener `fn` from events of type `types` on `node`.

##### `.events.trigger(node, type, properties)`

Triggers event of `type`, with optional `properties`, on `node`.

##### `.Event(type, properties)`

Returns a DOM event object with properties copied from `properties`.

##### `.isPrimaryButton(e)`

Returns boolean.

##### `.preventDefault(e)`

Calls `e.preventDefault()`.

#### Feature detection

##### `.features`

An object of feature detection results.

## Events

##### `activate`

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

##Install

Install `dom`:

    git clone https://github.com/stephband/dom.git
    cd dom/
    npm install

Lint the contents of `js/`:

	npm run lint

##History

*0.1*: first import from jquery.event.move and Fn library

##Tweet me

If you use DOM on something interesting, tweet me <a href="http://twitter.com/stephband">@stephband</a>.
