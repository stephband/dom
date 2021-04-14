
/**
element(name, options)

Registers a custom element and returns its constructor.

- name: 'name' Custom element tag name
- options: {
    mode:       'open' or 'closed', defaults to 'closed'
    focusable:  true or false, defaults to true
    properties: An object of attribute and property handlers
    
    // Lifecycle handlers
    construct:  called during element construction
    connect:    called when element added to DOM
    load:       called when stylesheets load
    disconnect: called when element removed from DOM
    enable:     called when form element enabled
    disable:    called when form element disabled
    reset:      called when form element reset
    restore:    called when form element restored
}

The `extends` property can only create customised built-in elements in browsers
that support the feature. Safari is a known culprit. Mileage will vary.

The effects of the `mode` option are subtle. In 'closed' mode, the element is
not given a publicly accessible `shadowRoot` property, and events that traverse
the shadow boundary are retargeted (as they are in 'open' mode) but also have
their `path` list truncated.

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

At the start of initialisation the `construct` handler is called. Use it to
set up a shadow root and define event handlers. Children and attributes must
not be inspected or assigned at this point – doing so will throw in some cases,
eg. construction via `document.createElement()`.

Following that, attribute handlers are called for attributes declared in the
HTML. The parser normally calls these in source order, but this can be problematic
if you require setup to run in a specific order so here they are run in the order
declared in the `options.properties`.

Then the `connect` handler is called when the element is placed in the DOM
or if it is already in the DOM and is being upgraded.

Finally the `load` handler is called after the first connect, and after any
stylesheet links in the shadow DOM have loaded. If there are no links, it is
called immediately after `connect`.

All lifecycle handlers are called with the parameter `(shadow)`.
*/

import create from './create.js';

const DEBUG = window.DEBUG === true;

const assign = Object.assign;
const define = Object.defineProperties;

const $internals = Symbol('internals');
const $shadow    = Symbol('shadow');

const constructors = {
    'a':        HTMLAnchorElement,
    'div':      HTMLDivElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'img':      HTMLImageElement,
    'ol':       HTMLOListElement,
    'ul':       HTMLUListElement,
    'template': HTMLTemplateElement
};

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly required, but provided for consistency.
    type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function() { return this.getAttribute('name') || ''; }
    },

    form:              { get: function() { return this[$internals].form; }},
    labels:            { get: function() { return this[$internals].labels; }},
    validity:          { get: function() { return this[$internals].validity; }},
    validationMessage: { get: function() { return this[$internals].validationMessage; }},
    willValidate:      { get: function() { return this[$internals].willValidate; }},
    checkValidity:     { value: function() { return this[$internals].checkValidity(); }},
    reportValidity:    { value: function() { return this[$internals].reportValidity(); }}
};

const nothing   = {};
const onceEvent = { once: true };
const shadowParameterIndex = 0;

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
/*
function getTemplateById(id) {
    const template = document.getElementById(id);

    if (!template || !template.content) {
        throw new Error('Template id="' + id + '" not found in document');
    }

    return template;
}
/*
function getTemplate(template) {
    if (template === undefined) { return; }

    return typeof template === 'string' ?
        // If template is an #id search for <template id="id">
        template[0] === '#' ? getTemplateById(template.slice(1)) :
        // It must be a string of HTML
        template :        
    template.content ?
        // It must be a template node
        template :
    typeof template === 'function' ?
        template :
        // Whatever it is, we don't support it
        function(){
            throw new Error('element() options.template not a template node, id or string');
        }() ;
}
*/
function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function createShadow(/*template, */elem, options) {
    /*if (template === undefined) { return; }
    */
    elem._initialLoad = true;

    // Create a shadow root if there is DOM content. Shadows may be 'open' or
    // 'closed'. Closed shadows are not exposed via element.shadowRoot, and
    // events propagating from inside of them report the element as target.
    const shadow = elem.attachShadow({
        mode:           options.mode || 'closed',
        delegatesFocus: options.focusable || false
    });

    elem[$shadow] = shadow;

    // If template is a string
    /*
    if (typeof template === 'string') {
        shadow.innerHTML = template;
    }
    else if (typeof template === 'function') {
        template(elem, shadow);
    }
    else {
        shadow.appendChild(template.content.cloneNode(true));
    }
    */

    return shadow;
}

function attachInternals(elem) {
    // Use native attachInternals where it exists
    if (elem.attachInternals) {
        return elem.attachInternals();
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM). We may
    // not yet put this in the DOM however – it violates the spec to give a
    // custom element children before it's contents are parsed. Instead we
    // wait until connectCallback.
    const hidden = create('input', { type: 'hidden', name: elem.name });

    // Polyfill internals object setFormValue
    hidden.setFormValue = function(value) {
        this.value = value;
    };

    return hidden;
}

function primeAttributes(elem) {
    elem._initialAttributes = {};
    elem._n = 0;
}

function advanceAttributes(elem, attributes, handlers) {
    const values = elem._initialAttributes;

    while(elem._n < attributes.length && values[attributes[elem._n]] !== undefined) {
        //console.log('ADVANCE ATTR', attributes[elem._n]);
        handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        ++elem._n;
    }
}

function flushAttributes(elem, attributes, handlers) {
    if (!elem._initialAttributes) { return; }

    const values = elem._initialAttributes;

    while(elem._n < attributes.length) {
        if (values[attributes[elem._n]] !== undefined && handlers[attributes[elem._n]]) {
            handlers[attributes[elem._n]].call(elem, values[attributes[elem._n]]);
        }
        ++elem._n;
    }

    delete elem._initialAttributes;
    delete elem._n;
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

export default function element(name, tag, options = tag) {
    tag = typeof tag === 'string' ?
        tag :
        options.extends ;

    // Get the element constructor from options.extends, or the
    // base HTMLElement constructor
    const constructor = typeof tag === 'string' ?
        getElementConstructor(tag) :
        HTMLElement ;

    const { attributes, properties } = options.properties ?
        Object.entries(options.properties).reduce(groupAttributeProperty, {
            attributes: {}, 
            properties: {}
        }) :
        nothing ;

    let template;

    function Element() {
        // Get a template node or HTML string from options.template
        //template = template === undefined ?
        //    getTemplate(options.template) :
        //    template ;

        // Construct an instance from Constructor using the Element prototype
        const elem   = Reflect.construct(constructor, arguments, Element);
        const shadow = options.construct && options.construct.length > shadowParameterIndex ?
            createShadow(/*template, */elem, options) :
            undefined ;

        if (Element.formAssociated) {
            // Get access to the internal form control API
            elem[$internals] = attachInternals(elem);
        }

        options.construct && options.construct.call(elem, shadow, elem[$internals]);

        // Preserve initialisation order of attribute initialisation by
        // queueing them
        if (attributes) {
            primeAttributes(elem);

            // Wait a tick to flush attributes
            Promise.resolve(1).then(function() {
                flushAttributes(elem, Element.observedAttributes, attributes);
            });
        }

        // At this point, if properties have already been set before the
        // element was upgraded, they exist on the elem itself, where we have
        // just upgraded it's protytype to define those properties those
        // definitions will never be reached. Either:
        //
        // 1. Define properties on the instance instead of the prototype
        //    Object.defineProperties(elem, properties);
        //
        // 2. Take a great deal of care not to set properties before an element
        //    is upgraded. I can't impose a restriction like that.
        //
        // 3. Copy defined properties to their prototype handlers and delete
        //    them on the instance.
        //
        // Let's go with 3. I'm not happy you have to do this, though.
        properties
        && Object.keys(properties).reduce(transferProperty, elem);

        return elem;
    }


    // Properties
    //
    // Must be defined before attributeChangedCallback, but I cannot figure out
    // why. Where one of the properties is `value`, the element is set up as a
    // form element.

    const prototype = Element.prototype = Object.create(constructor.prototype, properties) ;


    // Form properties

    if (properties && properties.value) {
        // Flag the Element class as formAssociated
        Element.formAssociated = true;
        
        // Define standard form properties
        define(prototype, formProperties);
    
        if (options.enable || options.disable) {
            prototype.formDisabledCallback = function(disabled) {
                return disabled ?
                    options.disable && options.disable.call(this, this[$shadow], this[$internals]) :
                    options.enable && options.enable.call(this, this[$shadow], this[$internals]) ;
            };
        }
        
        if (options.reset) {
            prototype.formResetCallback = function() {
                return options.reset.call(this, this[$shadow], this[$internals]);
            };
        }
        
        if (options.restore) {
            prototype.formStateRestoreCallback = function() {
                return options.restore.call(this, this[$shadow], this[$internals]);
            };
        }
    }


    // Attributes

    if (attributes) {
        Element.observedAttributes = Object.keys(attributes);

        prototype.attributeChangedCallback = function(name, old, value) {
            if (!this._initialAttributes) {
                return attributes[name].call(this, value) ;
            }

            // Keep a record of attribute values to be applied in
            // observedAttributes order
            this._initialAttributes[name] = value;
            advanceAttributes(this, Element.observedAttributes, attributes);
        };
    }


    // Lifecycle

    prototype.connectedCallback = function() {
        const elem      = this;
        const shadow    = elem[$shadow];
        const internals = elem[$internals];

        // Initialise any attributes that appeared out of order
        if (elem._initialAttributes) {
            flushAttributes(elem, Element.observedAttributes, attributes);
        }

        // If we have simulated form internals, append the hidden input now
        if (elem[$internals] && !elem.attachInternals) {
            elem.appendChild(elem[$internals]);
        }

        // If this is the first connect and there is an options.load fn,
        // _initialLoad is true
        if (elem._initialLoad) {
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
                        if (options.load) {
                            options.load.call(elem, shadow);
                        }
                    }
                };

                // Todo: But do we pick these load events up if the stylesheet is cached??
                while (n--) {
                    links[n].addEventListener('load', load, onceEvent);
                    links[n].addEventListener('error', function(e) {
                        console.log('Failed to load stylesheet', e.target.href);
                        load(e);
                    }, onceEvent);
                }

                if (options.connect) {
                    options.connect.call(this, shadow, internals);
                }
            }
            else {
                if (options.connect) {
                    options.connect.call(this, shadow, internals);
                }

                if (options.load) {
                    options.load.call(this, shadow, internals);
                }
            }
        }
        else if (options.connect) {
            options.connect.call(this, shadow, internals);
        }

        if (DEBUG) {
            console.log('%cElement', 'color: #3a8ab0; font-weight: 600;', '<' + elem.tagName.toLowerCase() + (elem.getAttribute('is') ? ' is="' + elem.getAttribute('is') + '"' : '') + '>');
        }
    }

    if (options.disconnect) {
        prototype.disconnectedCallback = function() {
            return options.disconnect.call(this, this[$shadow], this[$internals]);
        };
    }

    window.customElements.define(name, Element, tag && { extends: tag });
    return Element;
}
