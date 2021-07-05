
/** 
route(routes)

Accepts a function and an object of functions keyed by regexp patterns. Returns 
a function that takes a string and tests the regexes against it until a match is 
found. The matching function is called with a location object.

```js
const route = routes({
    '^path\/to\/([a-z])\/([0-9])\/': function(route) {
        // Properties of route object
        route.base       // Slice of pathname preceding current path
        route.path       // Matching slice of pathname - the current route
        route.route      // Remaining slice of pathname
        route.params     // Current URL params as on object
        route.identifier // Current fragment identifier (without a hash)
        route.state      // Current history state object

        // Get notified when route, params or state changes
        route.on({
            route:  () => ..., 
            params: () => ..., 
            identifier: () => ..., 
            state:  () => ...,
            stop:   () => ...
        });
    }
}));

route(window.location);
```
**/

import overload from '../../fn/modules/overload.js';
import Distributor from './distributor-2.js';

const DEBUG = true;

const assign  = Object.assign;
const trigger = Distributor.trigger;


/** 
Route(base, path, setup)
**/

const defaults = {
    search: '',
    params: null,
    hash:   '',
    identifier: '',
    json:   'null',
    state:  null
};

function stop(route) {
    //console.trace('stop', distributor);
    const handlers = route.handlers;
    var n = -1;
    var handler;

    while (handler = handlers[++n]) {
        handler.stop && handler.stop();
    }

    // Throw away references to all handlers
    handlers.length = 0;

    // End of route group ***
    if (DEBUG) { console.groupEnd(); }
}

function Route(base, path, route, captures) {
    this.base       = base;
    this.path       = path;
    this.route      = route;

    var n = -1;
    while(captures[++n] !== undefined) {
        this['$' + n] = captures[n];
    }

    Distributor.call(this);
}

assign(Route.prototype, Distributor.prototype, {
    params:     defaults.params,
    identifier: defaults.identifier,
    state:      defaults.state
});


/** 
routes()
**/

const names = [];

const nostate = {
    json:     'null',
    state:    null
};

function parseParam(string) {
    var value;
    return string === 'null' ? null :
        string === 'true' ? true :
        string === 'false' ? false :
        // Number string to number
        ((value = Number(string)) || value === 0) ? value :
        // Comma delimited string to array
        ((value = string.split(/\s*,\s*/)) && value.length > 1) ? value.map(parseParam) :
        // Yer basic string
        string ;
}

function fromEntries(entries) {
    const object = {};
    var key, value;

    for([key, value] of entries) {
        object[key] = parseParam(value);
    }

    return object;
}

function updateDataFromLocation(location, history, data) {
    names.length = 0;

    if (location.pathname !== data.pathname) {
        data.pathname = location.pathname;
        data.base = '';
        data.path = '/';
        data.route = location.pathname.slice(1);
        names.push('route');
    }

    if (location.search !== data.search) {
        data.search = location.search;
        data.params = location.search ?
            fromEntries(new URLSearchParams(location.search)) :
            defaults.params ;
        names.push('params');
    }

    if (location.hash !== data.hash) {
        data.hash = location.hash;
console.log('hash', location);
        data.identifier = location.hash.replace(/^#/, '') || defaults.identifier;
        names.push('identifier');
    }

    const json = JSON.stringify(history.state);
    if (json !== data.json) {
        data.json  = json;
        data.state = history.state;
        names.push('state');
    }

    return names;
}

function updateData(location, data) {
    return typeof location === 'string' ?
        updateDataFromLocation({
            pathname: location.replace(/(?:\?|#).*$/, ''),
            search:   location.replace(/^[^?]*/, '').replace(/#.*$/, ''),
            hash:     location.replace(/^[^#]*/, '')
        }, nostate, data) :

    // Or the global location object
    location === window.location ?
        updateDataFromLocation(location, window.history, data) :
    
    // Or another URL object
        updateDataFromLocation(location, nostate, data) ;
}

function updateRoute(location, route) {
    names.length = 0;

    if (location.params !== route.params) {
        route.params = location.params;
        names.push('params');
    }

    if (location.identifier !== route.identifier) {
        route.identifier = location.identifier;
        names.push('identifier');
    }

    if (location.state !== route.state) {
        route.state = location.state;
        names.push('state');
    }

    return names;
}

function toLocationType(location) {
    return location instanceof Route ? 'route' : 'url';
}

export default function routes(patterns) {
    const keys    = Object.keys(patterns);
    const regexps = keys.map((pattern) => RegExp(pattern));

    var route;

    function router(location) {
        const base   = location.base + location.path;
        const string = location.route;

        // Loop through regexes until a match is captured
        var regexp, captures, n = -1;

        while(
            (regexp = regexps[++n]) && 
            !(captures = regexp.exec(string))
        ); // Semicolon important here, don't remove

        // Ignore unmatching handlers
        if (!captures) {
            // No matches found, stop old route
            route && stop(route);
            route = undefined;

            // Signal to route distributor that nothing was handled
            return false;
        }

        const key  = keys[n];
        const path = captures.input.slice(0, captures.index + captures[0].length);
        const name = captures.input.slice(captures.index + captures[0].length);

        // Where .base and .path have not changed, .route must have changed
        // and params, identifier and state may have changed, so we update the 
        // existing route and notify as route
        if (route && route.base === base && route.path === path) {
            route.route       = name;
            route.params      = location.params;
            route.indentifier = location.identifier;
            route.state       = location.state;
            return trigger(['route'], route, route);
        }

        // Stop old route and create a new one
        route && stop(route);

        // Start of route group ***
        if (DEBUG) { console.group('route ' + path); }

        // Create a new route object
        route = new Route(base, path, name, captures);

        // Update params, identifier, state
        const changed = updateRoute(location, route);

        // Call route handler with (route, $1, $2, ...)
        captures[0] = route;
        const output = patterns[key].apply(this, captures);

        // Notify changes to params, identifier, state
        changed.length && trigger(names, route, route);

        return output;
    }

    var data;

    return overload(toLocationType, {
        // Location is a Route object
        route: function(location) {
            location.on({
                route: () => router(location),

                params: () => {
                    if (!route) { return; }
                    if (location.params === route.params) { return; }
                    route.params = location.params;
                    return trigger(['params'], route, route);
                },

                identifier: () => {
                    if (!route) { return; }
                    if (location.identifier === route.identifier) { return; }
                    route.identifier = location.identifier;
                    return trigger(['identifier'], route, route);
                },

                state: () => {
                    if (!route) { return; }
                    if (location.state === route.state) { return; }
                    route.state = location.state;
                    return trigger(['state'], route, route);
                },

                stop: () => {
                    route && stop(route);
                    route = undefined;
                }
            });

            return router(location);
        },

        // Location is a URL
        url: function(location) {
            // Keep a cache of values at root level
            data = data || Object.assign({}, defaults);

            // Is it a URL string?
            const changed = updateData(location, data);

            // Handle changes to route
            if (changed[0] === 'route') {
                // Handle changes to root
                return router(data);
            }

            if (!route) {
                console.log('NO ROUTE!! Is this right? Can this happen?');
                return;
            }

            // Update params, identifier, state
            route.params      = data.params;
            route.indentifier = data.identifier;
            route.state       = data.state;

            // Notify changes to params, identifier, state
            changed.length && trigger(changed, route, route);
        }
    });
}
