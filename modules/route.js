





${ /^arse\//.test(location.path) ? include(a, data) : include(b, data)  }






class Route {
    #location;
    #path;

    constructor(base, location) {
        this.#location = location;

        this.#path = Signal.from(() => );

        this.base      = base;


    },

    /** .hash **/
    get hash() {
        return hash.value;
    },

    /** .identifier **/
    set identifier(id) {
        // Replacing the hash normally does not update :target styles. It's a
        // bad oversight on the part of browsers.
        // https://github.com/whatwg/html/issues/639
        //
        // This is close to replacing the hash without changing the history.
        // Replace the id, then add a new entry with the same id, then go back.
        // This appears to update :target without a hashchange event and without
        // scrolling in Chrome, although at the expense of creating a forward
        // history entry and a popstate.

        const url = id ?
            '#' + id :
            location.href.replace(/#.*$/, '');

        updateTarget(url);
    },

    get identifier() {
        return this.hash && stripHash(this.hash) || defaults.identifier;
    },

    /** .params **/
    get params() {
        return this.search ?
            Object.fromEntries(new URLSearchParams(this.search)) :
            defaults.params ;
    },

    /** .pathname **/
    get pathname() {
        return pathname.value;
    },

    /** .name **/
    get path() {
        return this.#location.path;
    },

    /** .search **/
    get search() {
        return Object.fromEntries(new URLSearchParams(location.search));
    },

    /** .href **/
    get href() {
        return href.value;
    },

    /** .state **/
    get state() {
        return state.value;
    }
};

export function route() {
    return new Route();
}
