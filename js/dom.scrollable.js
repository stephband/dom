// dom.popable
//
// Extends the default behaviour of events for the .tip class.

(function(window) {

    var dom     = window.dom;
    var name    = "scrollable";
    var on      = dom.events.on;
    var trigger = dom.events.trigger;

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
console.log('ACTIVATE', target);
        e.default();
        activeScrollable = target;
	}

	function deactivate(e) {
        if (!e.default) { return; }

        var target = e.target;
        if (!dom.classes(target).contains(name)) { return; }
console.log('DEACTIVATE', target);
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
            left: 0,
            top:  0,
            width:  window.innerWidth,
            height: window.innerHeight
        };
    }

    function update() {
        var scrollables = dom('.scrollable');
        var boxes       = scrollables.map(box);
        var winBox      = windowBox();

        var n = -1;
        while (boxes[++n]) {
            if (boxes[n].top < winBox.height / 2 && boxes[n].bottom > winBox.height / 2) {
                break;
            }
        }

        if (n >= boxes.length) {
            return;
        }

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
    on(window,   'scroll', update);
    update();
})(this);
