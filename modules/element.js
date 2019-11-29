
// Create a custom element
//
// element(name, template, attributes, properties, options)
//
// - name:       Custom element name
// - template:   A template node, id of a template node or HTML string
// - attributes: An object of attribute change handler functions
// - properties: An object of property definitions
// - options: {
//       extends:    Name of tag to extend
//       shadow:     Template string, node or id used to create a shadow DOM
//       setup:      Lifecycle handler called during element construction
//       connect:    Lifecycle handler called when element added to DOM
//       disconnect: Lifecycle handler called when element removed from DOM
//   }

import { choose, isDefined, nothing } from '../../fn/module.js';

const shadowOptions = { mode: 'open' };

const constructors = {
    'a':        HTMLAnchorElement,
    'p':        HTMLParagraphElement,
    'br':       HTMLBRElement,
    'img':      HTMLImageElement,
    'template': HTMLTemplateElement
};

function getElementConstructor(tag) {
        // Return a constructor from the known list of tag names – not all tags
        // have constructor names that match their tags
    return constructors[tag]
        // Or assemble the tag name in the form "HTMLTagElement" and return
        // that property of the window object
        || window['HTML' + tag[0].toUpperCase() + tag.slice(1) + 'Element'];
};

function transferProperty(elem, key) {
    if (elem.hasOwnProperty(key)) {
        const value = elem[key];
        delete elem[key];
        elem[key] = value;
    }

    return elem;
}

function getTemplateById(id) {
    const template = document.getElementById(options.shadow.slice(1));

    if (!template || !template.content) {
        throw new Error('Template "' + options.shadow + '" not found in document');
    }

    return template;
}

export default function element(name, attributes, properties, options) {
    // Legacy...
    // element() has changed signature from (name, template, attributes, properties, options) –
    // support the old signature with a warning.
    if (typeof attributes === 'string' || 'innerHTML' in attributes) {
        console.warn('dom element(): template parameter is now passed in as option.shadow');
        options.shadow = attributes;
        return element(name, arguments[2], arguments[3], arguments[4]);
    }

    // Get the element constructor from options.tag, or the
    // base HTMLElement constructor
    const Constructor = options.extends ?
        getElementConstructor(options.extends) :
        HTMLElement ;

    if (!Constructor) {
        throw new Error('Constructor not found for tag "' + options.extends + '"');
    }

    const template = options && options.shadow && (
        typeof options.shadow === 'string' ?
            // If options.shadow is an #id, search for <template id="id">
            options.shadow[0] === '#' ? getTemplateById(options.shadow.slice(1)) :
            // It must be a string of HTML
            options.shadow :
        options.shadow.content ?
            // It must be a template node
            options.shadow :
        // Whatever it is, we don't support it
        function(){
            throw new Error('element() options.shadow not recognised as template node, id or string');
        }()
    );

    const Element = template ? function Element() {
        // Construct on instance of Constructor using the Element prototype
        const elem = Reflect.construct(Constructor, arguments, Element);

        // Create a shadow root if there is DOM content
        const shadow = template && elem.attachShadow(shadowOptions) ;

        // If template is a <template>
        if (typeof template === 'string') {
            shadow.innerHTML = template;
        }
        else {
            shadow.appendChild(template.content.cloneNode(true));
        }

        options.setup && options.setup.call(elem, shadow);

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
        Object.keys(properties).reduce(transferProperty, elem);

        return elem;
    } : function Element() {
        // Construct on instance of Constructor using the Element prototype
        const elem = Reflect.construct(Constructor, arguments, Element);
        options.setup && options.setup.call(elem);
        Object.keys(properties).reduce(transferProperty, elem);
        return elem;
    } ;


    // Properties
    //
    // {
    //     name: { get: fn, set: fn }
    // }

    Element.prototype = Object.create(Constructor.prototype, properties || {}) ;


    // Attributes - object of functions called when attributes change
    //
    // {
    //     name: fn
    // }

    Element.observedAttributes = Object.keys(attributes);

    Element.prototype.attributeChangedCallback = function(name, old, value) {
        attributes[name].call(this, value, name);
    };


    // Lifecycle

    if (options.connect) {
        Element.prototype.connectedCallback = options.connect;
    }

    if (options.disconnect) {
        Element.prototype.disconnectedCallback = options.disconnect;
    }

    window.customElements.define(name, Element, options);
    return Element;
}
