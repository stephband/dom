
## Events

##### `dom-activate`

Requires `js/dom-activate.js`.

##### `dom-deactivate`

Requires `js/dom-activate.js`.

##### `dom-touch`

Requires `js/dom-touch.js`.

A `touch` event fires following a `mousedown` or `touchstart` and as soon as the
pointer has moved more than a threshold 6px from it's start position. It carries
a stream of coordinates for the finger as `e.detail()`.

    dom
    .event("dom-touch", document)
    .each(function(e) {
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

##### `dom-swipe`

Requires `js/dom-touch.js` and `js/dom-swipe.js`.

A swipe event fires after a single touch has performed a swipe gesture in a
node with the class `swipeable`.

    <div class="swipeable">Swipe me</div>

    dom
    .event("dom-swipe", document)
    .each(function(e) {
        // e.target is <div class="swipeable">
    });
