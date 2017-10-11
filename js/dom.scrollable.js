// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(window) {

    var Fn      = window.Fn;
    var dom     = window.dom;

    var by      = Fn.by;
    var pow     = Fn.pow;
    var animate = dom.animate;
    var offset  = dom.offset;
    var on      = dom.events.on;

    var name    = "scrollable";

    var activeScrollable;

    function activate(e) {
        if (!e.default) { return; }

        var target = e.target;
        if (!dom.classes(target).contains(name)) { return; }

        // If node is already active, ignore
        if (target === activeScrollable) { return; }

        if (activeScrollable) {
            if (target === activeScrollable) {
                return;
            }

            dom.trigger('dom-deactivate', activeScrollable);
        }

        e.default();
        activeScrollable = target;

        var pos;

        // If we are not currently scrolling (TODO: test on iOS)
        if (performance.now() > scrollTime + 500) {
            pos = offset(dom.viewport, target);
            animate(0.6, pow(2), 'scrollTop', dom.viewport, pos[1]);
        }
	}

	function deactivate(e) {
        if (!e.default) { return; }

        var target = e.target;
        if (!dom.classes(target).contains(name)) { return; }
        e.default();

        // If node is already active, ignore
        if (target === activeScrollable) {
            activeScrollable = undefined;
        }
	}





    function box(node) {
        return node.getClientRects()[0];
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

    var scrollTime = 0;

    function record(e) {
        scrollTime = e.timeStamp;
    }

    function update(e) {
        var scrollables = dom('.scrollable');
        var boxes       = scrollables.map(box).sort(by('top'));
        var winBox      = windowBox();

        var n = -1;
        while (boxes[++n]) {
            // Stop on scrollable lower than the break
            if (boxes[n].top > winBox.height / 2) {
                break;
            }
        }
        --n;

        if (n < 0) { return; }
        if (n >= boxes.length) { return; }

        var scrollable = scrollables[n];

        if (activeScrollable) {
            if (scrollable === activeScrollable) {
                return;
            }

            dom.trigger('dom-deactivate', activeScrollable);
        }

        dom.trigger('dom-activate', scrollable);
    }

    on(document, 'dom-activate', activate);
    on(document, 'dom-deactivate', deactivate);
    on(window,   'scroll', record);
    on(window,   'scroll', update);
    update();
})(this);
