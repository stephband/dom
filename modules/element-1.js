
/**
element(tag, lifecycle, properties, stylesheet, message)

Registers a custom element `tag` and returns its constructor.

- `tag`: A string in the form `'custom-name'`, `'<custom-name>'`,
`'tag is="custom-name"'` or `'<tag is="custom-name">'`
- `lifecycle`: `{
    mode:       'open' or 'closed'
    focusable:  true or false
    shadow:     html string or '#template-id' or fragment

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
}`
- `properties`: `{
    name: {
        construct: fn called before lifecycle.construct
        attribute: fn called on `element.setAttribute('name', ...)`
        set:       fn called on setting property 'name'
        get:       fn called on getting property 'name'
    }
}`
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
`load`... if there is no slotted content, `slotchange` may not be called at
all...)

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

import capture           from 'fn/capture.js';
import create            from './create.js';
import toLoadPromise     from './element-1/to-load-promise.js';
import toPrefetchPromise from './element-1/to-prefetch-promise.js';
import { createInternals, getInternals } from './element-1/internals.js';

const define  = Object.defineProperties;
const nothing = {};
const constructors = {};

console.warn('element() function at element-1.js deprecated, import from element.js');

/*
const constructors = {
    // List only those elements whose constructor names do not match their tag
    'a':        HTMLAnchorElement,
    'caption':  HTMLTableCaptionElement,
    'col':      HTMLTableColElement,
    'colgroup': HTMLTableColElement,
    'datalist': HTMLDataListElement,
    'dir':      HTMLDirectoryElement,
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
    'textarea': HTMLTextAreaElement,
    'td':       HTMLTableCellElement,
    'th':       HTMLTableCellElement,
    'tr':       HTMLTableRowElement,
    'tbody':    HTMLTableSectionElement,
    'thead':    HTMLTableSectionElement,
    'tfoot':    HTMLTableSectionElement,
    'ul':       HTMLUListElement
};
*/

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly required, but provided for consistency.
    //type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function()     { return this.getAttribute('name') || ''; }
    },

    form:              { get:   function() { return getInternals(this).form; }},
    labels:            { get:   function() { return getInternals(this).labels; }},
    validity:          { get:   function() { return getInternals(this).validity; }},
    validationMessage: { get:   function() { return getInternals(this).validationMessage; }},
    willValidate:      { get:   function() { return getInternals(this).willValidate; }},
    checkValidity:     { value: function() { return getInternals(this).checkValidity(); }},
    reportValidity:    { value: function() { return getInternals(this).reportValidity(); }}
};

let supportsCustomisedBuiltIn = false;

function getElementConstructor(tag) {
    if (constructors[tag]) return constructors[tag];

    const constructor = document.createElement(tag).constructor;
    if (constructor === HTMLUnknownElement) {
        throw new Error('Cannot define customised built-in - constructor for <' + tag + '> is HTMLUnknownElement');
    }

    return constructors[tag] = constructor;
}

// Capture name and tag from <element-name> or <tag is="element-name">, syntax
// brackets and quotes optional
const parseNameTag = capture(/^\s*<?([a-z][\w]*-[\w-]+)>?\s*$|^\s*<?([a-z][\w]*)\s+is[=\s]*["']?([a-z][\w]*-[\w-]+)["']?>?\s*$/, {
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

function constructProperty(element, descriptor) {
    if (descriptor.construct) descriptor.construct.apply(element);
    return element;
}

function transferProperty(element, key) {
    if (element.hasOwnProperty(key)) {
        const value = element[key];
        delete element[key];
        element[key] = value;
    }
    return element;
}

function createShadow(elem, options, stylesheet) {
    // Create a shadow root. Shadows may be 'open' or 'closed'. Closed shadows
    // are not exposed via element.shadowRoot, and events propagating from
    // inside of them report the element as target. Default to 'closed'.
    const shadow = elem.attachShadow({
        mode:           options.mode || 'closed',
        delegatesFocus: options.focusable || false
    });

    if (stylesheet) {
        const link = create('link', { rel: 'stylesheet', href: stylesheet });
        shadow.append(link);
    }

    return shadow;
}

function fillShadowFromTemplate(shadow, template) {
    // It's a string
    if (typeof template === 'string') {
        // It's an id of a template
        if (template[0] === '#') {
            shadow.appendChild(
                document.getElementById(template.slice(1))
                .content.clone(true)
            );
        }
        // It's html
        else {
            shadow.innerHTML = template;
        }
    }
    // It's a <template>
    else {
        shadow.appendChild(template.content.clone(true));
    }

    return shadow;
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

export default function element(definition, lifecycle, api, stylesheet, log = '') {
    const { name, tag } = parseNameTag(definition);

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

        // Make shadow if mode or template have been set
        const shadow = lifecycle.mode || (typeof lifecycle.shadow === 'string') ?
            createShadow(element, lifecycle, stylesheet || lifecycle.stylesheet) :
            undefined ;

        // Fill shadow with template
        if (lifecycle.shadow) {
            fillShadowFromTemplate(shadow, lifecycle.shadow);
        }

        // Get access to the internals object. If form associated, internals is
        // the form control API internals object. We're gonna be rude and
        // extend it.
        const internals = createInternals(Element, element, shadow);
        const params = internals.params = [shadow, internals];

        // Flag unconnected until first connect
        internals.unconnected = true;

        // Flag support for custom built-ins. We know this when tag exists and
        // Element constructor is called
        if (tag) supportsCustomisedBuiltIn = true;

        if (properties) {
            // Loop over property descriptors and call descriptor construct()
            // function if it exists
            Object.values(properties).reduce(constructProperty, element);
        }

        if (lifecycle.construct) lifecycle.construct.apply(element, params);

        // At this point, if properties have been set before the element was
        // upgraded they already exist on the element itself, where we have
        // just upgraded it's protytype to define those properties. Those
        // definitions will never be reached. Either:
        //
        // 1. Define properties on the instance instead of the prototype, as in
        //    Object.defineProperties(element, properties);
        //
        // 2. Take a great deal of care when authoring not to set properties
        //    before an element is upgraded. We can't impose a restriction like that.
        //
        // 3. Copy defined properties to their prototype handlers and delete
        //    them on the instance.
        //
        // Let's go with 3. I'm not happy we have to do this, though.
        if (properties) {
            Object.keys(properties).reduce(transferProperty, element);
        }

        // Avoid flash of unstyled content in shadow DOMs that must load assets.
        if (shadow) {
            const links = shadow.querySelectorAll('link[rel="stylesheet"]');

            if (links.length) {
                // Hide all content other than the default slot until stylesheets
                // have loaded. We keep the default slot visible as that content
                // was visible before upgrade and we do not want it to momentarily
                // disappear.
                const style = create('style', '*:not(:has(slot:not([name]))) { display: none !important; }');
                shadow.append(style);

                internals.stylesheetsLoadPromise = Promise
                .all(Array.from(links, toLoadPromise))
                .finally(() => style.remove());
            }
        }

        return element;
    }

    // Prefetch stylesheet
    if (stylesheet) {
        toPrefetchPromise(stylesheet);
        log = window.DEBUG ?
            log + ' – stylesheet ' + stylesheet :
            log ;
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
                const internals = getInternals(this);
                return disabled ?
                    lifecycle.disable && lifecycle.disable.apply(this, internals.params) :
                    lifecycle.enable && lifecycle.enable.apply(this, internals.params) ;
            };
        }

        if (lifecycle.reset) {
            Element.prototype.formResetCallback = function() {
                const internals = getInternals(this);
                return lifecycle.reset.apply(this, internals.params);
            };
        }

        if (lifecycle.restore) {
            Element.prototype.formStateRestoreCallback = function() {
                const internals = getInternals(this);
                const params    = internals.params;
                return lifecycle.restore.apply(this, internals.params);
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
        const internals = getInternals(this);

        // If we have simulated form internals (for Safari), append the hidden
        // input now
        if (internals.polyfillInput) {
            elem.appendChild(internals.polyfillInput);
        }

        // If this is the first connect and there is a lifecycle.load fn,
        // unconnected is true
        if (internals.unconnected) {
            if (lifecycle.load && internals.stylesheetsLoadPromise) {
                internals.stylesheetsLoadPromise.then(() =>
                    lifecycle.load.apply(this, internals.params)
                );
            }
            else if (lifecycle.load) {
                // Guarantee that lifecycle load is called asynchronously in
                // cases where there is nothing to load
                Promise.resolve().then(() =>
                    lifecycle.load.apply(this, internals.params)
                );
            }

            delete internals.unconnected;
        }

        lifecycle.connect && lifecycle.connect.apply(this, internals.params);
    }

    if (lifecycle.disconnect) {
        Element.prototype.disconnectedCallback = function() {
            const internals = getInternals(this);
            return lifecycle.disconnect.apply(this, internals.params);
        };
    }

    // Log registration to console
    window.console &&
    window.console.log('%c<' + (tag ? tag + ' is=' + name + '' : name) + '>%c ' + log, 'color:#3a8ab0;font-weight:600;', 'color:#888888;font-weight:400;');

    // Define the element
    window.customElements.define(name, Element, tag && { extends: tag });

    // Safari partial polyfill.
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
            const shadow = lifecycle.mode || lifecycle.shadow ?
                createShadow(element, lifecycle, stylesheet || lifecycle.stylesheet) :
                undefined ;

            // Get access to the internals object
            const internals = createInternals(Element, element, shadow);

            // Run constructor
            lifecycle.construct && lifecycle.construct.call(element, shadow, internals);

            // Detect and run attributes
            let name;
            for (name in attributes) {
                // elements.attributes is sometimes undefined... why?
                const attribute = element.attributes[name];
                if (attribute) {
                    attributes[name].call(element, attribute.value);
                }
            }

            // Run connected callback
            lifecycle.connect && lifecycle.connect.call(element, shadow, internals);
        });
    }

    return Element;
}

export { getInternals };
