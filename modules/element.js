
/**
element(name, options)

- name: 'name'     Custom element tag name
- options: {
       extends:    Name of tag to extend, makes the element a custom built-in
       shadow:     String or template node or id used to create a shadow DOM
       attributes: A `{name: fn}` map called when named attributes change
       properties: A `{name: {get, set}}` map called on named property access
       construct:  Lifecycle handler called during element construction
       connect:    Lifecycle handler called when element added to DOM
       disconnect: Lifecycle handler called when element removed from DOM
   }
*/

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
        throw new Error('Template "' + options.shadow + '" not found in document');
    }

    return template;
}

function createShadow(template, elem) {
    if (!template) { return; }

    // Create a shadow root if there is DOM content
    const shadow = elem.attachShadow(shadowOptions) ;

    // If template is a <template>
    if (typeof template === 'string') {
        shadow.innerHTML = template;
    }
    else {
        shadow.appendChild(template.content.cloneNode(true));
    }

    return shadow;
}

export default function element(name, options) {
    // Legacy...
    // element() has changed signature from (name, template, attributes, properties, options) –
    // support the old signature with a warning.
    if (typeof options === 'string') {
        throw new Error('dom element(): new signature element(name, options). Everything is an option.');
    }

    // Get the element constructor from options.tag, or the
    // base HTMLElement constructor
    const constructor = options.extends ?
        getElementConstructor(options.extends) :
        HTMLElement ;

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

    function Element() {
        // Construct on instance of Constructor using the Element prototype
        const elem   = Reflect.construct(constructor, arguments, Element);
        const shadow = createShadow(template, elem);

        options.construct
        && options.construct.call(elem, shadow);

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
    // Map of getter/setters called when properties mutate.
    //
    // {
    //     name: { get: fn, set: fn }
    // }

    Element.prototype = Object.create(constructor.prototype, options.properties || {}) ;

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

    // options.connect

    if (options.connect) {
        Element.prototype.connectedCallback = options.connect;
    }

    // options.disconnect

    if (options.disconnect) {
        Element.prototype.disconnectedCallback = options.disconnect;
    }

    // options.extends

    window.customElements.define(name, Element, options);

    return Element;
}
