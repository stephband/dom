
# dom.js

A library of curried DOM functions for building reactive interfaces in HTML and
SVG.

<!--## Demo

<a href="http://stephband.info/dom/">stephen.band/dom/</a>-->


## Latest build 1.1.1

* <a href="http://stephen.band/dom/dist/dom.js">http://stephen.band/dom/dist/dom.js</a> (~120k, includes dependencies)
* <a href="http://stephen.band/dom/dist/dom.min.js">http://stephen.band/bolt/dist/dom.min.js</a> (~50k, includes dependencies)

## Getting started

Clone the repo:

    git clone git@github.com/stephband/dom.git
    cd dom/
    git submodule update --init

Install node modules:

    npm install

Build <code>dist/dom.js</code>:

    npm run build-nodeps    // Omit dependencies
    npm run build           // Include dependencies


## dom

##### `dom(selector)`

Returns an array of elements matching `selector` in `document` (alias of
`dom.query(selector, document)`).


## DOM Nodes

##### `.root`
##### `.head`
##### `.body`
##### `.view`

The main scrolling 'view' element, either the `<head>` or the `<body>`
(alias of `document.scrollingElement`).


## DOM lifecycle

##### `.ready(fn)`

Calls `fn` on DOM content load.


## DOM traversal

##### `.closest(selector, node)`

Returns the node itself or the closest ancestor that matches `selector`.
If no match is found, returns `undefined`.

##### `.children(node)`

Returns an array of child elements of `node`.

##### `.matches(selector, node)`

Returns `true` if `node` matches `selector`, otherwise `false`.

##### `.next(node)`

Returns the next sibling element node.

##### `.previous(node)`

Returns the previous sibling element node.

##### `.query(selector, node)`

Returns an array of all descendants of `node` that match `selector`.


## DOM inspection

##### `.attribute(name, node)`

Returns the string contents of attribute `name`, or if the attribute is known boolean, returns `true` or `false`.

##### `.classes(node)`

Returns the classList of `node`.

##### `.isCommentNode(node)`

Returns `true` if `node` is a comment.

##### `.isElementNode(node)`

Returns `true` if `node` is an element node.

##### `.isFragmentNode(node)`

Returns `true` if `node` is a fragment.

##### `.isTextNode(node)`

Returns `true` if `node` is a text node.

##### `.isInternalLink(node)`

Returns `true` if the `href` of `node` points to a resource on the same domain as the current document.

##### `.tag(node)`

Returns the tag name of `node`.

##### `.type(node)`

Returns `node` type as one of the strings `element`, `comment`, `text`,
`fragment`, `document` or `doctype`.


## DOM mutation

##### `.addClass(class, node)`

Adds `class` to the classList of `node`.

##### `.after(target, node)`

Inserts `node` after `target`.

##### `.append(target, node)`

Appends node to `target`.

If `node` is a collection of nodes, appends each node to `target`.

##### `.assign(node, attributes)`

Sets the key-value pairs of the object `attributes` as attributes on `node`.

##### `.before(target, node)`

Inserts `node` before target.

##### `.create(tag, text)`

Returns a new DOM node.

- If `tag` is `"text"` returns a text node with the content `text`.
- If `tag` is `"fragment"` returns a document fragment.
- If `tag` is `"comment"` returns a comment `<!-- text -->`.
- Anything else returns an element `<tag>text</tag>`, where `text` is inserted as inner html.

##### `.clone(node)`

Returns a deep copy of `node`.

##### `.empty(node)`

Removes content of `node`.

##### `.fragmentFromTemplate(node)`

Returns a DOM fragment containing the content of the template `node`.

##### `.fragmentFromHTML(string)`

Returns a DOM fragment of the parsed html `string`.

escape:               escape,
parse:                curry(parse),

##### `.identify(node)`

Returns the id of `node`, or where `node` has no id, a random id is generated,
set on `node` and returned:

    dom('button').map(dom.identify)...

If you just want to get an existing id rather than generate a new one, use the
Fn library's `get` function:

    dom('button').map(Fn.get('id'))...

##### `.parse(type, string)`

Returns a document parsed from `string`, where `type` is one of `'xml'`, `'html'` or `'svg'`.

##### `.remove(node)`

Removes `node` from the DOM.

##### `.removeClass(class, node)`

Removes `class` from the classList of `node`.

##### `.replace(target, node)`

Swaps `target` for `node`.


## DOM Events

##### `.Event(type, properties)`

Creates a CustomEvent of type `type`.
Additionally, `properties` are assigned to the event object.

##### `.event(type, node)`

Returns a mappable stream of events heard on `node`:

    var stream = dom
    .event('click', dom.body);
    .map(Fn.get('timeStamp'))
    .each(function(time) {
        // Do something with times
    });

Stopping the stream removes the event listeners:

    stream.stop();

##### `.requestEvent(type, fn, node)`

Calls fn once on the next event of `type`.

##### `.trapFocus(node)`

Constrains focus to focusable elements inside `node`.
Returns a function that removes the trap.
Creating a new trap also removes the existing trap.

##### `.trigger(type, node)`

Triggers event of `type` on `node`.

    dom.trigger('dom-activate', dom.get('toggle-id'));

##### `.isPrimaryButton(e)`

Returns `true` if user event is from the primary (normally the left or only) button of an input device. Use this to avoid listening to right-clicks.

##### `.preventDefault(e)`

Calls `e.preventDefault()`.

##### `.toKey(e)`

Returns key string corresponding to `e.keyCode`, or `undefined`.

<!--
##### `.events`

An object containing some lower-level, uncurried event methods.

    dom.events.on(node, types, fn, data)

Binds listener `fn` to events of type `types` on `node`. Listener `fn` is
passed 2 arguments – the event object and optional `data` object:

    dom.events.off(node, types, fn)

Unbinds listener `fn` from events of type `types` on `node`.

    dom.events.trigger(node, type, properties)

Triggers event of `type`, with optional `properties`, on `node`.
-->


## Style

##### `.box(node)`

Returns a `DOMRect` object describing the draw box of `node`.
(If `node` is `window` a plain object is returned).

##### `.bounds(node)`

Returns a `DOMRect` object describing the bounding box of `node` and its
descendants.

##### `.offset(node1, node2)`

Returns array `[x, y]` representing the vector from `node1` to `node2`.

##### `.position(node)`

Returns array `[x, y]` representing the screen coordinates of `node`.

##### `.prefix(string)`

Returns a prefixed CSS property name where a prefix is required in the current browser.

##### `.style(property, node)`

Returns the computed style `property` of `node`.
If `property` is of the form `"property:name"`, a named aspect of the property
is returned.

    dom.style('transform:rotate', node);     // returns rotation, as a number, in radians
    dom.style('transform:scale', node);      // returns scale, as a number
    dom.style('transform:translateX', node); // returns translation, as a number, in px
    dom.style('transform:translateY', node); // returns translation, as a number, in px

##### `.toPx(value)`

Takes a string of the form '10rem', '100vw' or '100vh' and returns a number in pixels.

##### `.toRem(value)`

Takes number in pixels and returns a string of the form '10rem'.


## Animation

##### `.animate(duration, transform, name, object, value)`

Animates property `name` of `object` to `value` over `duration` seconds, using
the `transform` function as an easing function. Updates the object on animation
frames.

##### `.requestFrame(fn)`

Alias of window.requestAnimationFrame.

##### `.transition(duration, fn)`

Calls `fn` on each frame until `duration` seconds has elapsed. `fn` is passed a
single argument `progress`, a number that ramps from 0-1 over the duration of
the transition.

    dom.transition(3, function(progress) {
        // Called every frame for 3 seconds
    });

The `.animate()` function uses `.transition()` behind the scenes.


## Scrolling

##### `.animateScroll(value)`

Shortcut helper for animating scrollTop of main view.

##### `.disableScroll(node)`

Disables scrolling by setting `overflow: hidden` on `node` while maintaining the current scrollTop, effectively causing the node to 'freeze'.

##### `.enableScroll(node)`

Enables scrolling by removing `overflow: hidden` on `node`.

##### `.scrollRatio(node)`

Return the ratio of scrollTop to scrollHeight.

<!--
##### `.safe`

A box object describing a safe viewing area. This property is to be updated or
replaced by your project. Used by locateable.
-->


## Feature detection

##### `.features`

An object of feature detection results.

    {
        inputEventsWhileDisabled: true, // false in FF, where disabled inputs don't trigger events
        template: true,                 // false in old browsers where template.content not found
        textareaPlaceholderSet: true,   // false in IE, where placeholder is also set on innerHTML
        transition: true                // false in older browsers where transitions not supported
    }


## History

*0.1*: first import from jquery.event.move and Fn library
*0.2*: API stabilised
...
*1.0*: Fixed method names
*1.1*: Improves box and animation functions
