// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(window) {

    var Fn       = window.Fn;
    var dom      = window.dom;

    var by       = Fn.by;
    var noop     = Fn.noop;
    var powOut   = Fn.exponentialOut;
    var animate  = dom.animate;
    var box      = dom.box;
    var offset   = dom.offset;
    var on       = dom.events.on;
    var matches  = dom.matches(".locateable, [locateable]");

    // Time after scroll event to consider the document is scrolling
    var idleTime = 90;

    // Duration and easing of scroll animation
    var scrollDuration  = 0.8;
    var scrollTransform = powOut(6);

    // Time of latest scroll event
    var scrollTime = 0;

    var activeNode;
    var cancel = noop;

    function activate(e) {
        if (!e.default) { return; }

        var target = e.target;
        if (!matches(target)) { return; }

        // If node is already active, ignore
        if (target === activeNode) { return; }

        if (activeNode) {
            if (target === activeNode) {
                return;
            }

            cancel();
            //scrollTime = e.timeStamp;
            dom.trigger('dom-deactivate', activeNode);
        }

        var t = e.timeStamp;
        var coords, safeTop;

        // Heuristic for whether we are currently actively scrolling. Checks:
        // Is scroll currently being animated OR
        // was the last scroll event ages ago ?
        // TODO: test on iOS
        if (scrollTime > t || t > scrollTime + idleTime) {
            coords     = offset(dom.viewport, target);
            safeTop    = dom.safe.top;
            scrollTime = t + scrollDuration * 1000;
            cancel     = animate(scrollDuration, scrollTransform, 'scrollTop', dom.viewport, coords[1] - safeTop);
        }

        e.default();
        activeNode = target;
    }

	function deactivate(e) {
        if (!e.default) { return; }

        var target = e.target;

        if (!matches(target)) { return; }

        e.default();

        // If node is already active, ignore
        if (target === activeNode) {
            activeNode = undefined;
        }
	}

    function windowBox() {
        return {
            left:   0,
            top:    0,
            right:  window.innerWidth,
            bottom: window.innerHeight,
            width:  window.innerWidth,
            height: window.innerHeight
        };
    }

    function update() {
        var locateables = dom('.locateable');
        var boxes       = locateables.map(box).sort(by('top'));
        var winBox      = windowBox();

        var n = -1;
        while (boxes[++n]) {
            // Stop on locateable lower than the break
            if (boxes[n].top > winBox.height / 2) {
                break;
            }
        }
        --n;

        if (n < 0) { return; }
        if (n >= boxes.length) { return; }

        var node = locateables[n];

        if (activeNode) {
            if (node === activeNode) {
                return;
            }

            dom.trigger('dom-deactivate', activeNode);
        }

        dom.trigger('dom-activate', node);
    }

    function scroll(e) {
        // If scrollTime is in the future we are currently animating scroll,
        // best do nothing
        if (scrollTime >= e.timeStamp) { return; }
        scrollTime = e.timeStamp;
        update();
    }

    on(document, 'dom-activate', activate);
    on(document, 'dom-deactivate', deactivate);
    on(window, 'scroll', scroll);
    update();
    dom.activeMatchers.push(matches);
})(this);
