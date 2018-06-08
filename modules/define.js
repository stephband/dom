import { choose, isDefined, nothing } from '../../fn/fn.js';

const shadowOptions = { mode: 'open' };

function intoObject(object, entry) {
    if (typeof entry[1] === 'function') {
        object[entry[0]] = entry[1];
    }
    else if (entry[1].change) {
        object[entry[0]] = entry[1].change;
    }

    return object;
}

function isPropertyDescriptor(object) {
    return object.get || object.set || 'value' in object ;
}

export default function defineElement(name, setup, attributes, dom) {
    function CustomElement() {
        var elem = Reflect.construct(HTMLElement, nothing, CustomElement);

        // Create a shadow root if there is DOM content
        if (isDefined(dom)) {
            const shadow = elem.attachShadow(shadowOptions);

            if (typeof dom === 'string') {
                shadow.innerHTML = dom;
            }
            else {
                shadow.appendChild(dom);
            }
        }

        // Run custom setup and return
        setup(elem);
        return elem;
    }

    CustomElement.prototype = Object.create(HTMLElement.prototype);

    if (attributes) {
        // Extract attribute handlers and register them to listen to changes
        const entries        = Object.entries(attributes);
        const changeHandlers = entries.reduce(intoObject, {});
        const changeCallback = choose(changeHandlers);

        CustomElement.observedAttributes = Object.keys(changeHandlers);
        CustomElement.prototype.attributeChangedCallback = function(attribute, old, value) {
            if (value === old) { return; }
            changeCallback.apply(this, arguments);
        };

        // Define properties. Where the descriptor is a function, assume that
        // we want a property to reflect the attribute. Where get, set or value
        // are not in the descriptor, don't define a property.
        entries.forEach(function(entry) {
            const name = entry[0];

            if (name in CustomElement.prototype) {
                throw new Error('Trying to create a property "' + name + '", but HTMLElement already defines that property.');
            }

            if (typeof entry[1] === 'function') {
                Object.defineProperty(CustomElement.prototype, name, {
                    get: function() {
                        return this.getAttribute(name) || '';
                    },

                    set: function(value) {
                        this.setAttribute(name, value);
                    }
                });
            }
            else if (isPropertyDescriptor(entry[1])) {
                Object.defineProperty(CustomElement.prototype, name, entry[1]);
            }
        });
    }

    window.customElements.define(name, CustomElement);
    return CustomElement;
}
