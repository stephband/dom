(function(window) {
	"use strict";

	var Fn     = window.Fn;
	var Stream = Fn.Stream;
	var dom    = window.dom;


	// Number of pixels a pressed pointer travels before movestart
	// event is fired.
	var threshold = 8;

	var ignoreTags = {
			textarea: true,
			input: true,
			select: true,
			button: true
		};

	var mouseevents = {
		move:   'mousemove',
		cancel: 'mouseup dragstart',
		end:    'mouseup'
	};

	var touchevents = {
		move:   'touchmove',
		cancel: 'touchend',
		end:    'touchend'
	};


	// Functions

	var requestTick     = Fn.requestTick;
	var on              = dom.events.on;
	var off             = dom.events.off;
	var trigger         = dom.events.trigger;
	var isPrimaryButton = dom.isPrimaryButton;
	var preventDefault  = dom.preventDefault;

	function isIgnoreTag(e) {
		return !!ignoreTags[e.target.tagName.toLowerCase()];
	}

	function identifiedTouch(touchList, id) {
		var i, l;

		if (touchList.identifiedTouch) {
			return touchList.identifiedTouch(id);
		}
		
		// touchList.identifiedTouch() does not exist in
		// webkit yet… we must do the search ourselves...
		
		i = -1;
		l = touchList.length;
		
		while (++i < l) {
			if (touchList[i].identifier === id) {
				return touchList[i];
			}
		}
	}

	function changedTouch(e, data) {
		var touch = identifiedTouch(e.changedTouches, data.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		// Chrome Android (at least) includes touches that have not
		// changed in e.changedTouches. That's a bit annoying. Check
		// that this touch has changed.
		if (touch.pageX === data.pageX && touch.pageY === data.pageY) { return; }

		return touch;
	}


	// Handlers that decide when the first movestart is triggered
	
	function mousedown(e){
		// Ignore non-primary buttons
		if (!isPrimaryButton(e)) { return; }

		// Ignore form and interactive elements
		if (isIgnoreTag(e)) { return; }

		on(document, mouseevents.move, mousemove, [e]);
		on(document, mouseevents.cancel, mouseend, [e]);
	}

	function mousemove(e, events){
		events.push(e);
		checkThreshold(e, events, e, removeMouse);
	}

	function mouseend(e, data) {
		removeMouse();
	}

	function removeMouse() {
		off(document, mouseevents.move, mousemove);
		off(document, mouseevents.cancel, mouseend);
	}

	function touchstart(e) {
		// Don't get in the way of interaction with form elements
		if (ignoreTags[e.target.tagName.toLowerCase()]) { return; }

		var touch = e.changedTouches[0];

		// iOS live updates the touch objects whereas Android gives us copies.
		// That means we can't trust the touchstart object to stay the same,
		// so we must copy the data. This object acts as a template for
		// movestart, move and moveend event objects.
		var event = {
			target:     touch.target,
			pageX:      touch.pageX,
			pageY:      touch.pageY,
			identifier: touch.identifier,

			// The only way to make handlers individually unbindable is by
			// making them unique. This is a crap place to put them, but it
			// will work.
			touchmove:  function() { touchmove.apply(this, arguments); },
			touchend:   function() { touchend.apply(this, arguments); }
		};

		on(document, touchevents.move, event.touchmove, [event]);
		on(document, touchevents.cancel, event.touchend, [event]);
	}

	function touchmove(e, events) {
		var touch = changedTouch(e, events[0]);
		if (!touch) { return; }
		checkThreshold(e, events, touch, removeTouch);
	}

	function touchend(e, events) {
		var touch = identifiedTouch(e.changedTouches, events[0].identifier);
		if (!touch) { return; }
		removeTouch(events);
	}

	function removeTouch(events) {
		off(document, touchevents.move, events[0].touchmove);
		off(document, touchevents.cancel, events[0].touchend);
	}

	function checkThreshold(e, events, touch, fn) {
		var distX = touch.pageX - events[0].pageX;
		var distY = touch.pageY - events[0].pageY;

		// Do nothing if the threshold has not been crossed.
		if ((distX * distX) + (distY * distY) < (threshold * threshold)) { return; }

		var e0   = events[0];
		var node = events[0].target;
		var stream;

		// Unbind handlers that tracked the touch or mouse up till now.
		fn(events);

		// Trigger the touch event
		trigger(events[0].target, 'dom-touch', {
			pageX:  e0.pageX,
			pageY:  e0.pageY,
			detail: function() {
				if (!stream) {
					stream = TouchStream(node, events);
				}

				return stream.clone();
			}
		});
	}


	// Handlers that control what happens following a movestart

	function activeMousemove(e, data) {
		data.touch = e;
		data.timeStamp = e.timeStamp;
		data.stream.push(e);
	}

	function activeMouseend(e, data) {
		var target = data.target;

		removeActiveMouse();
		data.stream.stop();

		// Unbind the click suppressor, waiting until after mouseup
		// has been handled.
		requestTick(function() {
			off(target, 'click', preventDefault);
		});
	}

	function removeActiveMouse() {
		off(document, mouseevents.move, activeMousemove);
		off(document, mouseevents.end, activeMouseend);
	}

	function activeTouchmove(e, data) {
		var touch = changedTouch(e, data);

		if (!touch) { return; }

		// Stop the interface from gesturing
		e.preventDefault();

		data.touch = touch;
		data.timeStamp = e.timeStamp;
		data.stream.push(touch);
	}

	function activeTouchend(e, data) {
		var touch  = identifiedTouch(e.changedTouches, data.identifier);

		// This isn't the touch you're looking for.
		if (!touch) { return; }

		removeActiveTouch(data);
		data.stream.stop();
	}

	function removeActiveTouch(data) {
		off(document, touchevents.move, data.activeTouchmove);
		off(document, touchevents.end, data.activeTouchend);
	}

	function TouchStream(node, events) {
		var stream = Stream(events).map(function(e) {
			return {
				x:    e.pageX - events[0].pageX,
				y:    e.pageY - events[0].pageY,
				time: (e.timeStamp - events[0].timeStamp) / 1000
			};
		});

		var data = {
			stream:     stream,
			target:     node,
			touch:      undefined,
			identifier: events[0].identifier
		};

		if (data.identifier === undefined) {
			// We're dealing with a mouse event.
			// Stop clicks from propagating during a move
			on(node, 'click', preventDefault);
			on(document, mouseevents.move, activeMousemove, data);
			on(document, mouseevents.cancel, activeMouseend, data);
		}
		else {
			// In order to unbind correct handlers they have to be unique
			data.activeTouchmove = function(e, data) { activeTouchmove(e, data); };
			data.activeTouchend  = function(e, data) { activeTouchend(e, data); };

			// We're dealing with a touch.
			on(document, touchevents.move, data.activeTouchmove, data);
			on(document, touchevents.end, data.activeTouchend, data);
		}

		return stream;
	}

	on(document, 'mousedown', mousedown);
	on(document, 'touchstart', touchstart);

})(this);
