
import './navigate.js';

const assign = Object.assign;

export const defaults = {
    search: '',
    params: {},
    hash:   '',
    identifier: '',
    // Legacy
    id:     '',
    json:   'null',
    state:  null
};

const config = window.config && window.config.location || {};


// Router scope

const location = assign({}, defaults);
export default location;


function parseParam(string) {
    var value;
    return string === '' ? '' :
        string === 'null' ? null :
        string === 'true' ? true :
        string === 'false' ? false :
        // Number string to number
        ((value = Number(string)) || value === 0) ? value :
        // Comma delimited string to array
        ((value = string.split(/\s*,\s*/)) && value.length > 1) ? value.map(parseParam) :
        // Yer basic string
        string ;
}

function parseSchemaValue(Type, defaultValue, value) {
    if (value === undefined || value === '') {
        return defaultValue;
    }

    if (typeof Type === 'function') {
        if (Type === Boolean) return Boolean(value);
        if (Type === Number)  return Number(value);
        if (Type === String)  return String(value);
        if (Type === Symbol)  return Symbol(value);
        return new Type(value);
    }

    throw new Error('Location params schema for arrays must be of the form: [constructor], other item values not yet supported. Or even thought about.');
}

function parseSchemaKey(config, params, key) {
    const schema = config[key];

    if (!schema) {
        throw new Error('config.location.params[' + key + '] not set');
    }

    if (!schema.type) {
        throw new Error('config.location.params[' + key + '].type is required');
    }

//console.log(key, schema, typeof params.get(key), params.get(key));

    // Is schema.type a constructor?
    if (typeof schema.type === 'function') {
        return parseSchemaValue(schema.type, schema.default, params.get(key));
    }

    if (schema.type.constructor === Array) {
        if (schema.type.length > 1) {
            // Array must match length of schema array
            throw new Error('Location params schema Array multiple values not yet supported');
        }

        // Schema array contains a single value, which we take to mean it may
        // contain any number of values (else why not accept a single value?)
        return params.getAll(key)
        .map((value) => parseSchemaValue(schema.type[0], schema.default, value));
    }

    throw new Error('config.location.params[' + key + '].schema is not a constructor and not an array');
}

function fromEntries(entries) {
    // Keep a note of what state each param is in: single, multiple or
    // undefined (unparsed)
    const state  = {};
    const object = {};
    var key, value;

    for([key, value] of entries) {
        if (state[key] === 'multiple') {
            // Values have already been got, ignore
        }
        else if (state[key] === 'single') {
            // As soon as we encounter a second instance of key, get all values
            // for key. We flatMap to accomodate the case where a single value
            // is parsed as an array, ie ?v=a&v=b,c ... although I'm not convinced
            // we should be supporting nonstandard ways of representing multiple
            // values
            object[key] = entries.getAll(key).flatMap(parseParam);
            state[key] = 'multiple';
        }
        else {
            // Where a schema exists in config for this key, use it to parse the
            // value or values
            if (config.params && config.params[key]) {
                object[key] = parseSchemaKey(config.params, entries, key);
                // Tell the automatic system not to look at this key again
                state[key] = 'multiple';
            }
            else {
                object[key] = parseParam(value);
                state[key] = 'single';
            }
        }
    }

    return object;
}

let json;

function updateDataFromLocation(location, history, data) {
    const object = Data.objectOf(data);

    if (location.pathname !== object.pathname) {
        data.pathname = location.pathname;
        data.base = '/';
        data.path = '';
        data.name = location.pathname.slice(1);
    }

    if (location.search !== object.search) {
        data.search = location.search;
        data.params = location.search ?
            fromEntries(new URLSearchParams(location.search)) :
            defaults.params ;
    }

    if (location.hash !== object.hash) {
        data.hash       = location.hash;
        data.identifier = location.hash.replace(/^#/, '') || defaults.identifier;
    }

    const state = JSON.stringify(history.state);

    if (state !== json) {
        json  = state;
        data.state = history.state;
    }
}

// Synchronise root location
updateDataFromLocation(window.location, window.history, location);

window.addEventListener('dom-navigate', function(e) {
    updateDataFromLocation(window.location, window.history, location);

    // TODO: devise some way of not preventing default when no routes have been
    // created. This is a bit tricky because this file is not the place for such
    // hijinks.
    e.preventDefault();
});
