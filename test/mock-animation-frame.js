
function mockAnimationFrame() {
    var requestAnimationFrame = window.requestAnimationFrame;
    var cancelAnimationFrame  = window.cancelAnimationFrame;
    var queue = [];
    var id = 0;
    var i = 0;

    function requestFrame(fn) {
        queue.push({
            id: ++id,
            fn: fn
        });

        return id;
    }

    function cancelFrame(id) {
        var n = queue.length;

        while (n--) {
            if (queue[n].id === id) {
                queue.splice(n, 1);
                return;
            }
        }
    }

    // Overwrite
    window.requestAnimationFrame = requestFrame;
    window.cancelAnimationFrame  = cancelFrame;

    console.warn('request/cancelAnimationFrame mocked');

    /*function stop() {
        window.fireAnimationFrame();
        window.requestAnimationFrame = requestAnimationFrame;
        window.cancelAnimationFrame  = cancelAnimationFrame;
        delete window.fireAnimationFrame;
    }*/

    // Return the firing fn */
    return (window.fireAnimationFrame = function fire() {
        var entry;
        var time = window.performance.now();

        console.group('Frame ' + ++i + ', time ' + time.toFixed(3) + 's, ' + queue.length + ' callbacks -----------------');

        while ((entry = queue.shift())) {
            entry.fn.call(null, time);
        }

        console.groupEnd();
    });
}

window.mockAnimationFrame = mockAnimationFrame;
