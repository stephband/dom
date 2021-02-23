
import matches from '../../fn/modules/matches.js';
import location from './location.js';

const assign = Object.assign;


/** 
Route(source)
**/

export function Route() {
    this.routes = [];
    this.stops  = [];
}

assign(Route.prototype, {
    on: function(regexp, route) {
        regexp = RegExp(regexp);

        if (this.routes.find(matches({ route }))) {
            throw new Error('Route already attached');
        }

        this.routes.push({ regexp, route });
        return this;
    },

    off: function(route) {
        const n = this.routes.findIndex(matches({ route }));

        if (n > -1) {
            this.routes.splice(n, 1);
        }

        return this;
    },

    push: function(data) {
        // Data has not changed
        if (this.data === data) {
            return this;
        }

        this.data = data;

        // Data is null
        if (data === null) {
            this.routes.forEach((r) => r.route.push(null));
            return this;
        }

        const path  = data.path;
        const stops = this.stops;
        var n = -1, entry, regexp, route, captures;

        while(entry = this.routes[++n]) {
            regexp   = entry.regexp;
            route    = entry.route;
            captures = regexp.exec(path);

            if (captures) {
                route.push(assign({}, data, {
                    path:     path.slice(captures.index + captures[0].length),
                    captures: captures.slice(1)
                }));
            }
            else {
                route.push(null);
            }
        }
    },

    create: function create(regexp) {
        const route = new Route();
        this.on(regexp, route);
        return route;
    },

    stop: function stop() {
        var n = this.routes.length;

        while (n--) {
            this.routes[n].stop();
        }
    }
});
