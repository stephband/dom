
import create from './create.js';

/**
element(name, options)

- name: 'name'     Custom element tag name, eg. ''
- options: {
       extends:    Name of tag to extend, makes the element a custom built-in element
       mode:       'open' or 'closed', defaults to closed
       template:   String or template node or id used to create a shadow DOM
       attributes: A `{name: fn}` map called when named attributes change
       properties: A map of properties defined on the element prototype. Where
            the property `value` is defined extra work is done to make the
            element work inside a form
       construct:  Lifecycle handler called during element construction with shadow as first argument
       connect:    Lifecycle handler called when element added to DOM with shadow as first argument
       disconnect: Lifecycle handler called when element removed from DOM
       enable:     Lifecycle handler called when form element enabled
       disable:    Lifecycle handler called when form element disabled
       reset:      Lifecycle handler called when form element reset
       restore:    Lifecycle handler called when form element restored
   }
*/

const assign = Object.assign;

const constructors = {
    'a':        HTMLAnchorElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'img':      HTMLImageElement,
    'template': HTMLTemplateElement
};

//const inputEvent = new CustomEvent('input', eventOptions);

const $internals = Symbol('internals');
const $shadow    = Symbol('shadow');

const formProperties = {
    // These properties echo those provided by native form controls.
    // They are not strictly necessary, but provided for consistency.
    type: { value: 'text' },

    name: {
        set: function(name) { return this.setAttribute('name', name); },
        get: function() { return this.getAttribute('name') || ''; }
    },

    form: { get: function() { return this[$internals].form; }},
    labels: { get: function() { return this[$internals].labels; }},
    validity: { get: function() { return this[$internals].validity; }},
    validationMessage: { get: function() { return this[$internals].validationMessage; }},
    willValidate: { get: function() { return this[$internals].willValidate; }},

    // Methods
    checkValidity: { value: function() { return this[$internals].checkValidity(); }},
    reportValidity: { value: function() { return this[$internals].reportValidity(); }}
};

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

function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function getTemplateById(id) {
    const template = document.getElementById(id);

    if (!template || !template.content) {
        throw new Error('Template id="' + id + '" not found in document');
    }

    return template;
}

function createShadow(template, elem, options) {
    if (!template) { return; }

    // Create a shadow root if there is DOM content. Shadows may be 'open' or
    // 'closed'. Closed shadows are not exposed via element.shadowRoot, and
    // events propagating from inside of them report the element as target.
    const shadow = elem.attachShadow({
        mode: options.mode || 'closed',
        delegatesFocus: true
    });

    elem[$shadow] = shadow;

    // If template is a <template>
    if (typeof template === 'string') {
        shadow.innerHTML = template;
    }
    else {
        shadow.appendChild(template.content.cloneNode(true));
    }

    return shadow;
}

function attachInternals(elem) {
    // Use native attachInternals where it exists
    if (elem.attachInternals) {
        return elem.attachInternals();
    }

    // Otherwise polyfill it with a pseudo internals object, actually a hidden
    // input that we put inside element (but outside the shadow DOM)
    const hidden = create('input', { type: 'hidden', name: elem.name });
    elem.appendChild(hidden);

    // Polyfill internals object setFormValue
    hidden.setFormValue = function(value) {
        this.value = value;
    };

    return hidden;
}


export default function element(name, options) {

    // Get the element constructor from options.extends, or the
    // base HTMLElement constructor
    const constructor = options.extends ?
        getElementConstructor(options.extends) :
        HTMLElement ;

    const template = options && options.template && (
        typeof options.template === 'string' ?
            // If options.template is an #id, search for <template id="id">
            options.template[0] === '#' ? getTemplateById(options.template.slice(1)) :
            // It must be a string of HTML
            options.template :
        options.template.content ?
            // It must be a template node
            options.template :
        // Whatever it is, we don't support it
        function(){
            throw new Error('element() options.template not recognised as template node, id or string');
        }()
    );

    function Element() {
        // Construct an instance from Constructor using the Element prototype
        const elem   = Reflect.construct(constructor, arguments, Element);
        const shadow = createShadow(template, elem, options);

        if (Element.formAssociated) {
            // Get access to the internal form control API
            elem[$internals] = attachInternals(elem);
        }

        options.construct && options.construct.call(elem, shadow);

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
        options.properties
        && Object.keys(options.properties).reduce(transferProperty, elem);

        return elem;
    }


    // options.properties
    //
    // Map of getter/setters called when properties mutate. Must be defined
    // before attributeChangedCallback, but I'm not sure why right now.
    //
    // {
    //     name: { get: fn, set: fn }
    // }
    //
    // Where one of the properties is `value`, this element is set up as a form
    // element.

    if (options.properties && options.properties.value) {
        // Flag the Element class as formAssociated
        Element.formAssociated = true;

        Element.prototype = Object.create(constructor.prototype, assign({}, formProperties, options.properties, {
            value: {
                get: options.properties.value.get,
                set: function() {
                    // After setting value
                    options.properties.value.set.apply(this, arguments);

                    // Copy it to internal form state
                    this[$internals].setFormValue('' + this.value);
                }
            }
        })) ;
    }
    else {
        Element.prototype = Object.create(constructor.prototype, options.properties || {}) ;
    }


    // options.attributes
    //
    // Map of functions called when named attributes change.
    //
    // {
    //     name: fn
    // }

    if (options.attributes) {
        Element.observedAttributes = Object.keys(options.attributes);

        Element.prototype.attributeChangedCallback = function(name, old, value) {
            options.attributes[name].call(this, value, name);
        };
    }


    // Lifecycle
    // https://html.spec.whatwg.org/multipage/custom-elements.html#custom-element-reactions
    //
    // More lifecycle reactions are available in the spec:
    // adoptedCallback
    // formAssociatedCallback

    if (options.connect) {
        // Pass shadow to connect(shadow) function
        Element.prototype.connectedCallback = function() {
            return options.connect.call(this, this[$shadow]);

            // 'input' events are suppused to traverse the shadow boundary
            // but they do not. At least not in Chrome 2019 - a
            /*this[$shadow].addEventListener('input', (e) => {
                if (!e.composed) {
                    console.warn('Custom element not allowing input event to traverse shadow boundary');
                    this.dispatchEvent(inputEvent);
                }
            });*/
        };
    }

    if (options.disconnect) {
        Element.prototype.disconnectedCallback = function() {
            return options.disconnect.call(this, this[$shadow]);
        };
    }


    // Form lifecycle

    if (Element.formAssociated) {
        if (options.enable || options.disable) {
            Element.prototype.formDisabledCallback = function(disabled) {
                return disabled ?
                    options.disable && options.disable.call(this, this[$shadow]) :
                    options.enable && options.enable.call(this, this[$shadow]) ;
            };
        }

        if (options.reset) {
            Element.prototype.formResetCallback = function() {
                return options.reset.call(this, this[$shadow]);
            };
        }

        if (options.restore) {
            Element.prototype.formStateRestoreCallback = function() {
                return options.restore.call(this, this[$shadow]);
            };
        }
    }


    // Define element

    window.customElements.define(name, Element, options);
    return Element;
}
