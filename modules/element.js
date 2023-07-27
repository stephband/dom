
/**
element(tag, lifecycle, properties, stylesheet, message)

Registers a custom element `tag` and returns its constructor.

- `tag`: A string in the form `'custom-name'`, `'<custom-name>'`,
`'tag is="custom-name"'` or `'<tag is="custom-name">'`
- `lifecycle`: {
    mode:       'open' or 'closed'
    focusable:  true or false

    // Styleheet
    stylesheet: optional string path to stylesheet for shadow DOM

    // Lifecycle handlers
    construct:  called during element construction
    connect:    called when element added to DOM
    load:       called when stylesheet loaded
    disconnect: called when element removed from DOM

    // Form elements
    enable:     called when form element enabled
    disable:    called when form element disabled
    reset:      called when form element reset
    restore:    called when form element restored
}
- `properties`: {
    name: {
        attribute: fn called on `element.setAttribute('name', ...)`
        set:       fn called on setting property 'name'
        get:       fn called on getting property 'name'
    }
}
- `stylesheet`: url of a stylesheet to load in to the shadow DOM
- `message`: optional debug message to logged when element is registered

The name form `'tag is="element-name"'` creates customised built-in elements in
browsers that support the feature. Safari does not, but support is somewhat
polyfilled. Mileage will vary.

#### Lifecycle

Lifecycle handlers are called with the element as `this` and with the parameters
`shadow` and `internals`.

On initialisation the `construct` handler is called. Set up the shadow root and
define event handlers here. Children and attributes must not be inspected or
assigned at this point: doing so will throw an error when constructed via
`document.createElement()`.

Following that, attribute handlers in `properties` are called for attributes
declared in the HTML. The HTML parser normally calls these in source order.

Then the `connect` handler is called when the element is placed in the DOM, or
if it is already in the DOM and is being upgraded.

Both `load` and `slotchange` are asynchronous. Things get a little tricky here.
The order of `load` callbacks and `'slotchange'` listeners cannot be guaranteed
in Safari. When there is an empty cache `slotchange` comes first, as it always
does in other browsers, otherwise `load` happens first.

Where there is a stylesheet loading, most browsers call `'slotchange'` listeners
(asynchronously) before `load` – except Safari, where if the stylesheet is
already cached `load` is called before `'slotchange'` listeners. (TODO: I would
like to guarantee `slotchange` before `load`, but it is not clear how to delay
`load`... if there is no slotted content, `slotchange` may not be called at all...)

Finally, `connect` and `disconnect` are called whenever the element is inserted
into or removed from the DOM.

The effects of the `mode` option are subtle. In 'closed' mode, the element is
not given a publicly accessible `shadowRoot` property, and events that traverse
the shadow boundary are retargeted (as they are in 'open' mode) but also have
their `path` list truncated.

### Properties

Where the `properties` object contains a definition for a `value` property, work
is done to give the element form field behaviour. The constructor is assigned
the property `formAssociated` which signals to the browser that it constructs
form fields. Where they are not defined in `properties` the prototype is
assigned default handlers for the standard properties `type`, `name`, `form`,
`labels`, `validity`, `validationMessage`, `willValidate`, `checkValidity`
and `reportValidity`. Form behaviour is also mildly polyfilled in browsers
without support by inserting a hidden input inside the element but outside the
shadow DOM. Mileage will vary. Managing focus can be problematic without browser
support.
*/

import create  from './create.js';
import capture from '../../fn/modules/capture.js';

const $internals = Symbol('internals');
const $shadow    = Symbol('shadow');

const define = Object.defineProperties;

const constructors = {
    // We need list only those whose constructor names do not match their tag
    'a':        HTMLAnchorElement,
    'article':  HTMLElement,
    'dl':       HTMLDListElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'fieldset': HTMLFieldSetElement,
    'hr':       HTMLHRElement,
    'img':      HTMLImageElement,
    'li':       HTMLLIElement,
    'ol':       HTMLOListElement,
    'optgroup': HTMLOptGroupElement,
    'q':        HTMLQuoteElement,
    'section':  HTMLElement,
    'textarea': HTMLTextAreaElement,
    'td':       HTMLTableCellElement,
    'th':       HTMLTableCellElement,
    'tr':       HTMLTableRowElement,
    'tbody':    HTMLTableSectionElement,
    'thead':    HTMLTableSectionElement,
    'tfoot':    HTMLTableSectionElement,
    'ul':       HTMLUListElement
};

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly required, but provided for consistency.
    //type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function() { return this.getAttribute('name') || ''; }
    },

    form:              { get:   function() { return this[$internals].form; }},
    labels:            { get:   function() { return this[$internals].labels; }},
    validity:          { get:   function() { return this[$internals].validity; }},
    validationMessage: { get:   function() { return this[$internals].validationMessage; }},
    willValidate:      { get:   function() { return this[$internals].willValidate; }},
    checkValidity:     { value: function() { return this[$internals].checkValidity(); }},
    reportValidity:    { value: function() { return this[$internals].reportValidity(); }}
};

const nothing   = {};
const onceEvent = { once: true };
const shadowParameterIndex = 0;

let supportsCustomisedBuiltIn = false;

function getElementConstructor(tag) {
        // Return a constructor from the known list of tag names – not all tags
        // have constructor names that match their tags
    return constructors[tag]
        // Or assemble the tag name in the form "HTMLTagElement" and return
        // that property of the window object
        || window['HTML' + tag[0].toUpperCase() + tag.slice(1) + 'Element']
        || (() => {
            throw new Error('Constructor not found for tag "' + tag + '"');
        })();
}

// Capture name and tag from <element-name> or <tag is="element-name">, syntax
// brackets and quotes optional
const captureNameTag = capture(/^\s*<?([a-z][\w]*-[\w-]+)>?\s*$|^\s*<?([a-z][\w]*)\s+is[=\s]*["']?([a-z][\w]*-[\w-]+)["']?>?\s*$/, {
    1: (data, captures) => ({
        name: captures[1]
    }),

    2: (data, captures) => ({
        name: captures[3],
        tag:  captures[2]
    }),

    catch: function(data, name) {
        throw new SyntaxError('dom element() – name must be of the form \'element-name\' or \'tag is="element-name"\' (' + name + ')')
    }
}, null);

function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function createShadow(elem, options, stylesheet) {
    elem._initialLoad = true;

    // Create a shadow root if there is DOM content. Shadows may be 'open' or
    // 'closed'. Closed shadows are not exposed via element.shadowRoot, and
    // events propagating from inside of them report the element as target.
    const shadow = elem.attachShadow({
        mode:           options.mode || 'closed',
        delegatesFocus: options.focusable || false
    });

    if (stylesheet) {
        const link = create('link', { rel: 'stylesheet', href: stylesheet });
        shadow.append(link);
    }

    elem[$shadow] = shadow;

    return shadow;
}

function attachInternals(elem) {
    var internals;

    // Use native attachInternals where it exists
    if (elem.attachInternals) {
        internals = elem.attachInternals();
        if (internals.setFormValue) {
            return internals;
        }
    }
    else {
        internals = {
            shadowRoot: elem.shadowRoot
        };
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    internals.input = create('input', { type: 'hidden', name: elem.name });
    elem.appendChild(internals.input);

    // Polyfill internals object setFormValue
    internals.setFormValue = function(value) {
        this.input.value = value;
    };

    return internals;
}

function toLoadPromise(asset) {
    return new Promise((resolve, reject) => {
        asset.addEventListener('load', resolve, onceEvent);
        asset.addEventListener('error', reject, onceEvent);
    });
}

function onload(loadables, fn) {
    Promise
    .all(Array.from(loadables, toLoadPromise))
    .finally(fn);
}

function hasPropertyAttribute(option) {
    return !!option.attribute;
}

function hasPropertyDefinition(option) {
    return option.set || option.get || option.hasOwnProperty('value');
}

function groupAttributeProperty(data, entry) {
    if (hasPropertyAttribute(entry[1])) {
        data.attributes[entry[0]] = entry[1].attribute;
    }

    if (hasPropertyDefinition(entry[1])) {
        data.properties[entry[0]] = entry[1];
    }

    return data;
}

export function getInternals(element) {
    return element[$internals] = element[$internals] || {};
}

export default function element(definition, lifecycle, api, stylesheet, log = '') {
    const { name, tag } = captureNameTag(definition);

    // Get the element constructor or the base HTMLElement constructor
    const constructor = typeof tag === 'string' ?
        getElementConstructor(tag) :
        HTMLElement ;

    const { attributes, properties } = api ?
        Object.entries(api).reduce(groupAttributeProperty, {
            attributes: {},
            properties: {}
        }) :
        nothing ;

    function Element() {
        // Construct an instance from Constructor using the Element prototype
        const element = Reflect.construct(constructor, arguments, Element);

        // Inject shadow if .construct() asks for it
        const shadow = lifecycle.construct && lifecycle.construct.length > shadowParameterIndex ?
            createShadow(element, lifecycle, stylesheet || lifecycle.stylesheet) :
            undefined ;

        // Get access to the internal form control API
        const internals = Element.formAssociated ?
            attachInternals(element) :
            {} ;

        if (tag) {
            supportsCustomisedBuiltIn = true;
        }

        lifecycle.construct && lifecycle.construct.call(element, shadow, internals);

        // At this point, if properties have already been set before the
        // element was upgraded, they exist on the element itself, where we have
        // just upgraded it's protytype to define those properties those
        // definitions will never be reached. Either:
        //
        // 1. Define properties on the instance instead of the prototype
        //    Object.defineProperties(element, properties);
        //
        // 2. Take a great deal of care not to set properties before an element
        //    is upgraded. I can't impose a restriction like that.
        //
        // 3. Copy defined properties to their prototype handlers and delete
        //    them on the instance.
        //
        // Let's go with 3. I'm not happy you have to do this, though.
        properties && Object.keys(properties).reduce(transferProperty, element);

        // Avoid flash of unstyled content in shadow DOMs that must load assets
        // by hiding all content other than the default slot until assets have
        // loaded
        if (shadow) {
            const assets = shadow.querySelectorAll('link[rel="stylesheet"]');

            if (assets.length) {
                const style = create('style', '*:not(:has(slot:not([name]))) { display: none !important; }');
                shadow.append(style);

                internals.loadPromise = Promise
                .all(Array.from(assets, toLoadPromise))
                .finally(() => style.remove());
            }
        }

        return element;
    }


    // Properties

    // Must be defined before attributeChangedCallback, but I cannot figure out
    // why. Where one of the properties is `value`, the element is set up as a
    // form element.
    Element.prototype = Object.create(constructor.prototype, properties) ;

    if (properties && properties.value) {
        // Flag the Element class as formAssociated
        Element.formAssociated = true;

        // Define standard form properties
        define(Element.prototype, formProperties);

        if (lifecycle.enable || lifecycle.disable) {
            Element.prototype.formDisabledCallback = function(disabled) {
                return disabled ?
                    lifecycle.disable && lifecycle.disable.call(this, this[$shadow], this[$internals]) :
                    lifecycle.enable && lifecycle.enable.call(this, this[$shadow], this[$internals]) ;
            };
        }

        if (lifecycle.reset) {
            Element.prototype.formResetCallback = function() {
                return lifecycle.reset.call(this, this[$shadow], this[$internals]);
            };
        }

        if (lifecycle.restore) {
            Element.prototype.formStateRestoreCallback = function() {
                return lifecycle.restore.call(this, this[$shadow], this[$internals]);
            };
        }
    }


    // Attributes

    if (attributes) {
        Element.observedAttributes = Object.keys(attributes);

        Element.prototype.attributeChangedCallback = function(name, old, value) {
            return attributes[name].call(this, value) ;
        };
    }


    // Lifecycle

    Element.prototype.connectedCallback = function() {
        const elem      = this;
        const shadow    = elem[$shadow];
        const internals = elem[$internals];

        // If we have simulated form internals for Safari, append the hidden
        // input now
        //if (elem[$internals] && !elem.attachInternals) {
        //    elem.appendChild(elem[$internals].input);
        //}

        // If this is the first connect and there is an lifecycle.load fn,
        // _initialLoad is true
        if (elem._initialLoad) {
            if (internals.loadPromise) {
                internals.loadPromise.then(() => {
                    delete elem._initialLoad;
                    if (lifecycle.load) {
                        lifecycle.load.call(elem, shadow);
                    }
                });
            }
/*
            const links = shadow.querySelectorAll('link[rel="stylesheet"]');

            if (links.length) {
                let count  = 0;
                let n = links.length;

                const load = function load(e) {
                    if (++count >= links.length) {
                        // Delete _initialLoad. If the element is removed
                        // and added to the DOM again, stylesheets do not load
                        // again
                        delete elem._initialLoad;
                        if (lifecycle.load) {
                            lifecycle.load.call(elem, shadow);
                        }
                    }
                };

                const loadError = window.DEBUG ?
                    (e) => {
                        console.error('Failed to load stylesheet', e.target.href);
                        load(e);
                    } :
                    load ;

                while (n--) {
                    links[n].addEventListener('load', load, onceEvent);
                    links[n].addEventListener('error', loadError, onceEvent);
                }
            }
*/
            else if (lifecycle.load) {
                // Guarantee that lifecycle load is called asynchronously
                Promise.resolve(1).then(() =>
                    lifecycle.load.call(this, shadow, internals)
                );
            }
        }

        lifecycle.connect && lifecycle.connect.call(this, shadow, internals);
    }

    if (lifecycle.disconnect) {
        Element.prototype.disconnectedCallback = function() {
            return lifecycle.disconnect.call(this, this[$shadow], this[$internals]);
        };
    }

    // Log registration to console
    window.console &&
    window.console.log('%c<' + (tag ? tag + ' is=' + name + '' : name) + '>%c ' + log, 'color: #3a8ab0; font-weight: 600;', 'color: #888888; font-weight: 400;');

    // Define the element
    window.customElements.define(name, Element, tag && { extends: tag });

    // Where tag is supplied, element should have been registered as a customised
    // built-in and the constructor would have run if any were in the DOM already.
    // However, Safari does not support customised built-ins. Here we attempt to
    // go some way towards filling in support by searching for elements and
    // assigning their intended APIs to them.
    if (tag && !supportsCustomisedBuiltIn) {
        if (window.DEBUG) {
            console.warn('Browser does not support customised built-in elements, polyfilling <' + tag + ' is="' + name + '">');
        }

        document.querySelectorAll('[is="' + name + '"]').forEach((element) => {
            // Define properties on element
            if (properties) {
                define(element, properties);
            }

            // Construct an instance from Constructor using the Element prototype
            const shadow = lifecycle.construct && lifecycle.construct.length > shadowParameterIndex ?
                createShadow(element, lifecycle, stylesheet || lifecycle.stylesheet) :
                undefined ;

            // Run constructor
            lifecycle.construct && lifecycle.construct.call(element, shadow);

            // Detect and run attributes
            let name;

            for (name in attributes) {
                // elements.attributes is sometimes undefined... why?
                const attribute = element.attributes[name];
                if (attribute) {
                    attributes[name].call(element, attribute.value);
                }
            }

            lifecycle.connect && lifecycle.connect.apply(element);
        });
    }

    return Element;
}
