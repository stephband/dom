
import id       from 'fn/id.js';
import overload from 'fn/overload.js';
import toType   from 'fn/to-type.js';
import Signal   from 'fn/signal.js';
import { getInternals } from './internals.js';

const assign = Object.assign;

function getSignal(element, name, initial) {
    /* Creates and returns a signal at internals.$name */
    const internals = getInternals(element);
    return internals['$' + name] || (
        internals['$' + name] = Signal.of(initial)
    );
}

export function createAttribute(name, initial, parse = id) {
    return {
        attribute: function(value) {
            const signal = getSignal(this, name);
            signal.value = value === null ? initial : parse(value) ;
        }
    };
}

export function createProperty(name, initial, parse = id) {
    return {
        get: function() {
            const signal = getSignal(this, name, initial);
            return signal.value;
        },

        set: function(value) {
            const signal = getSignal(this, name);
            signal.value = parse(value);
        },

        enumerable: true
    };
}

export function createAttributeProperty(name, initial, parse = id) {
    return assign(createProperty(name, initial, parse), {
        attribute: function(value) {
            this[name] = value === null ? undefined : value.trim() ;
        }
    });
}

export function createBooleanAttribute(name) {
    return assign(createProperty(name, initial), {
        attribute: function(value) {
            const signal = getSignal(this, name);
            signal.value = value !== null;
        },

        set: function(value) {
            if (value) this.setAttribute(name, '');
            else this.removeAttribute(name);
        }
    });
}

export function createStringAttribute(name, parse = id) {
    return createAttrProp(name, '', (value) => {
        return value ? parse(value) : '' ;
    });
}

export function createNumberAttribute(name, initial, min, max, parse = id) {
    return createAttrProp(name, initial, (value) => {
        const number = parse(value);

        if (Number.isNaN(number)) {
            throw new TypeError('Attempt to set ' + typeof value + ' on property, expects a number');
        }

        return clamp(min, max, number);
    });
}

export function createObjectAttribute(name) {
    return createAttrProp(name, null, overload(toType, {
        string: JSON.parse,
        object: id,
        initial: (value) => {
            if (value) throw new TypeError('element(): Attempt to set non-object on element.' + name);
            return null;
        }
    }));
}
