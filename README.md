
# dom.js

A library of curried DOM functions for building reactive interfaces in HTML and
SVG.

<!--## Demo

<a href="http://stephband.info/dom/">stephen.band/dom/</a>-->


## Latest build 1.1.3

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

root
head
body
view

The main scrolling 'view' element, either the `<head>` or the `<body>`
(alias of `document.scrollingElement`).


## DOM lifecycle

/*
ready(fn)`

Calls `fn` on DOM content load.

*/
## DOM traversal


/*
next(node)`

Returns the next sibling element node, or `undefined`.
*/
/*
previous(node)`

Returns the previous sibling element node, or `undefined`.
*/
/*
query(selector, node)`

Returns an array of all descendants of `node` that match `selector`.


## DOM inspection








## DOM mutation









## DOM Events



/*
requestEvent(type, fn, node)`

Calls fn once on the next event of `type`.
*/
/*
trapFocus(node)`

Constrains focus to focusable elements inside `node`.
Returns a function that removes the trap.
Creating a new trap also removes the existing trap.
*/




<!--
/*
events`

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

/*
box(node)`

Returns a `DOMRect` object describing the draw box of `node`.
(If `node` is `window` a plain object is returned).
*/
/*
bounds(node)`

Returns a `DOMRect` object describing the bounding box of `node` and its
descendants.
*/
/*
offset(node1, node2)`

Returns array `[x, y]` representing the vector from `node1` to `node2`.
*/
/*
position(node)`

Returns array `[x, y]` representing the screen coordinates of `node`.
*/
/*
style(property, node)`

Returns the computed style `property` of `node`.
If `property` is of the form `"property:name"`, a named aspect of the property
is returned.

    dom.style('transform:rotate', node);     // returns rotation, as a number, in radians
    dom.style('transform:scale', node);      // returns scale, as a number
    dom.style('transform:translateX', node); // returns translation, as a number, in px
    dom.style('transform:translateY', node); // returns translation, as a number, in px

/*
toPx(value)`

Takes a string of the form '10rem', '100vw' or '100vh' and returns a number in pixels.
*/
/*
toRem(value)`

Takes number in pixels and returns a string of the form '10rem'.


## Animation

/*
animate(duration, transform, name, object, value)`

Animates property `name` of `object` to `value` over `duration` seconds, using
the `transform` function as an easing function. Updates the object on animation
frames.
*/
/*
requestFrame(fn)`

Alias of window.requestAnimationFrame.
*/
/*
transition(duration, fn)`

Calls `fn` on each frame until `duration` seconds has elapsed. `fn` is passed a
single argument `progress`, a number that ramps from 0-1 over the duration of
the transition.

    dom.transition(3, function(progress) {
        // Called every frame for 3 seconds
    });

The `.animate()` function uses `.transition()` behind the scenes.


## Scrolling

/*
animateScroll(value)`

Shortcut helper for animating scrollTop of main view.
*/
/*
disableScroll(node)`

Disables scrolling by setting `overflow: hidden` on `node` while maintaining the
current scrollTop, effectively causing the node to 'freeze'.
*/
/*
enableScroll(node)`

Enables scrolling by removing `overflow: hidden` on `node`.
*/
/*
scrollRatio(node)`

Return the ratio of scrollTop to scrollHeight.

<!--
/*
safe`

A box object describing a safe viewing area. This property is to be updated or
replaced by your project. Used by locateable.
-->


## HTML

/*
escape(string)`

Escapes `string` for setting safely as HTML.
*/
/*
fragmentFromHTML(string)`

Returns a DOM fragment of the parsed html `string`.
*/
/*
fragmentFromTemplate(node)`

Returns a DOM fragment containing the content of the template `node`.
*/
/*
parse(type, string)`

Returns a document parsed from `string`, where `type` is one of `'xml'`,
`'html'` or `'svg'`.
*/
/*
prefix(string)`

Returns a prefixed CSS property name where a prefix is required in the current
browser.


## Feature detection

/*
features`

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
