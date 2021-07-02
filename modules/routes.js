
/** 
route(routes)

Accepts a function and an object of functions keyed by regexp patterns. Returns 
a function that takes a string and tests the regexes against it until a match is 
found. The matching function is called with a location object.

```js
location.on(route({
    '^path\/to\/([a-z])\/([0-9])\/': function(location) {
        // Properties of location object
        location.pathname // Full pathname from root route
        location.base     // Slice of pathname preceding current path
        location.path     // Matching slice of pathname - the current route
        location.route    // Remaining slice of pathname
        location.params   // Current URL params
        location.state    // Current history state object

        // Teardown view when location expires
        location.done(function teardown() {
            // Teardown
        });
    }
}));
```
**/

import is      from '../../fn/modules/is.js';
import matches from '../../fn/modules/matches.js';
import noop    from '../../fn/modules/noop.js';
import nothing from '../../fn/modules/nothing.js';

const assign = Object.assign;





/** 
Distributor(handle)

Returns an object with `.on()`, `.off()` and `.push()` methods, and also 
`.handleEvent()` so that it may be used directly as a DOM event handler. 
Incoming event objects are transformed by `handle` (where `handle` is 
passed in) before being distributed to listeners bound via `distributor.on(fn)`.
**/

function distribute(handlers, name, value) {
    var n = -1;
    var handled, handler, output;

    while (handler = handlers[++n]) {
        if (!(name in handler) && !('*' in handler)) { continue; }

        output = name in handler ?
            handler[name](value) :
            handler['*'](value) ;

        handled = handled === undefined ?
            output :
            output === undefined ? handled :
            handled + output ;
    }

    return handled;
}

function Distributor(setup) {
    this.handlers = [];
    this.dones = [];
    setup.call(this, (name, value) => distribute(this.handlers, name, value));
}

assign(Distributor.prototype, {
    on: function(name, fn) {
        if (!arguments.length) {
            throw new Error('Cannot pass `' + fn + '` to distributor.on()');
        }

        const listener = typeof name === 'string' ?
            { [name]: fn } :
            name ;

        this.handlers.push(listener);
        return this;
    },

    off: function(name, fn) {
        const i = typeof name === 'string' ?
            this.handlers.findIndex(matches({ [name]: fn })) :
            this.handlers.findIndex(is(name)) ;

        if (i === -1) { return this; }

        this.handlers.splice(i, 1);
        return this;
    },

    done: function(fn) {
        this.dones.push(fn);
    },

    stop: function() {
        // Throw away references to all handlers
        this.handlers.length = 0;

console.log('STOP', this.dones.length);

        // Call done handlers, remove references
        if (this.dones) {
            this.dones.forEach((fn) => fn());
            this.dones.length = 0;
        }
    }
});


/** 
Location(base, path, setup)
**/

function Location(base, path, route, setup, parent) {
    this.base     = base;
    this.path     = path;
    this.route    = route;
    this.pathname = parent.pathname || '';
    this.params   = parent.params;
    this.state    = parent.state;

    // Push done fns to top level location (old)
    if (parent.done) {
        this.done = parent.done;
    }

    Distributor.call(this, setup);
}

assign(Location.prototype, Distributor.prototype, {

});


/** 
routes()
**/

export default function routes(patterns) {
    const regexps = Object.keys(patterns).map((pattern) => RegExp(pattern));
    var location = nothing;
    var distribute = noop;

    return function route(parent) {
        const string =
            // Path is a string
            typeof path === 'string' ? parent :
            // Path is a route path object
            ('route' in parent) ? parent.route :
            // Path is a new URL()
            parent.pathname ? parent.pathname.slice(1) :
            // There is no path change
            '' ;

        if (parent.done) {
            parent.done(() => {
console.log('LOCATION', location.base + location.path, 'PARENT DONE');
                location.stop();
            });
        }

        // Where a path has not been found do not update routes
        if (!string) { return; }

        // Call any registered teardown function
        //var d = -1;
        //while (dones[++d]) { dones[d](); }
        //dones.length = 0;

        const base = parent.route ? parent.base + parent.path : '/';
        var n = -1, regexp, names = '';

        while(regexp = regexps[++n]) {
            const captures = regexp.exec(string);

            // Ignore unmatching handlers
            if (!captures) { continue; }

            const path  = captures.input.slice(0, captures.index + captures[0].length);
            const route = captures.input.slice(captures.index + captures[0].length);

            // Where path and base have not changed mutate existing location
            if (location.path === path && location.base === base) {
                //names.length = 0;

                if (location.state !== parent.state) {
                    //names.push('state');
                    location.state = parent.state;
                    console.log('LOCATION', location.base + location.path, 'STATE');
                }

                if (location.params !== parent.params) {
                    //names.push('params');
                    location.params = parent.params;
                    console.log('LOCATION', location.base + location.path, 'PARAMS');
                }

                if (location.route !== route) {
                    //names.push('route');
                    location.route = parent.route;
                    console.log('LOCATION', location.base + location.path, 'ROUTE');
                }

                distribute(names, location);
                return;
            }

            // Stop old location and create a new one
            location.stop();

            location = new Location(base, path, route, function(push, stop) {
                distribute = push;
                distribute(names, location);
            }, parent);

            location.done(() => {
console.log('LOCATION', location.base + location.path, 'DONE');
                location = nothing;
                distribute = noop;
            });

            // Make the first parameter the location
console.log('LOCATION', location.base + location.path, 'NEW');
            const output = patterns[regexp.source.replace('\\/', '/')](location);

            // If there was output, pass it on, otherwise default to true
            // since a handler was called and we assume it is handled
            return output === undefined ? true : output ;
        }

        // No matches found, stop old location
        location.stop();

        // Signal to location distributor that nothing was handled
        return false;
    };
}
