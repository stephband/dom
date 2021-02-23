
/** 
route(toString, routes)

Accepts a function and an object of functions keyed by regexp patterns, and 
returns a function that takes a string and tests the regexes against it until 
a match is found. The function for that match is called with the remainder of 
the path string plus the contents of any captured groups.

```js
location.on(route(get('path'), {
    '^path\/to\/([a-z])\/([0-9])\/': function(data, path, $1, $2) {
        // Set up view

        return function teardown() {
            // Teardown view
        };
    }
}));
```
**/

import pattern from '../../fn/modules/pattern.js';

export function route(toString, routes) {
    const fn = pattern(toString, routes);
    var end;
    return function route() {
        if (typeof end === 'function') { end(); }
        end = fn.apply(this, arguments);
    };
}


const assign = Object.assign;

function Router(routes, source = location) {
    const toString = get('pathname');
    const fn = pattern(toString, routes);
    var view;

    function push(data) {
        if (view) {
            if (typeof view === 'function') { view(); }
            if (view.push) { view.push(null); }
        }

        view = fn(data);
    }

    this.stop = function() {
        if (view) {
            if (typeof view === 'function') { view(); }
            if (view.stop) { view.stop(); }
        }
        
        view = undefined;
        source.off(push);
    };
    
    source.on(push);
}

const router = new Router({
    '^arse/': function arse(data, path) {
        console.log('Arse');

        router.push(assign({}, data, {
            pathname: path,
            state: transform(data.state)
        }));

        return function() {
            router.push(null);
        }
    },

    '^n-(\\d+)/': pattern(arg(1), {
        '^([a-z]+)/': function(data, path, $1) {
            router.push();
            console.log(path, captures);
        }
    })
})

location.on((data) => router.push(data));


