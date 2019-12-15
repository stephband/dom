
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



*/
## DOM traversal





## DOM inspection








## DOM mutation









## DOM Events








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





## Animation




## Scrolling




## HTML




## Feature detection




## History
