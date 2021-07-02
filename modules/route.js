
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

export default function route(patterns) {
    const regexps = Object.keys(patterns).map((pattern) => RegExp(pattern));
    const dones = [];

    function done(fn) {
        dones.push(fn);
    }
    
    const location = {
        base:     parent.route ? parent.base + parent.path : '/',
        pathname: parent.pathname || '',
        params:   parent.params,
        state:    parent.state,

        // Push teardown handlers up to the top level route()
        done: parent.done || done
    };

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

        // Where a path has not been found do not update routes
        if (!string) { return; }

        // Call any registered teardown function
        var d = -1;
        while (dones[++d]) { dones[d](); }
        dones.length = 0;

        var n = -1, regexp;
        while(regexp = regexps[++n]) {
            const captures = regexp.exec(string);
            
            // Ignore unmatching handlers
            if (!captures) { continue; }

            // Make the first parameter a location object
            location.path  = captures.input.slice(0, captures.index + captures[0].length);
            location.route = captures.input.slice(captures.index + captures[0].length);
            captures[0] = location;

            const output = patterns[regexp.source.replace('\\/', '/')].apply(this, captures);

            // If there was output, pass it on, otherwise default to true
            // since a handler was called and we assume it is handled
            return output === undefined ? true : output ;
        }

        // Signal to location distributor that nothing was handled
        return false;
    };
}
