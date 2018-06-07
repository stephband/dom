import { choose, nothing } from '../../fn/fn.js';
import { fragmentFromHTML } from '../dom.js';

const shadowOptions = { mode: 'open' };

export default function defineElement(name, setup, attributes, dom) {
    let content;

    function CustomElement() {
        var elem = Reflect.construct(HTMLElement, nothing, CustomElement);

        // Create a shadow root if there is content
        if (content) {
            const shadow = elem.attachShadow(shadowOptions);
            shadow.appendChild(content.cloneNode(true));
        }

        // Run custom setup and return
        setup(elem);
        return elem;
    }

    CustomElement.prototype = Object.create(HTMLElement.prototype);

    if (attributes) {
        // Create properties that reflect attributes
        const attrs = Object.keys(attributes);
        const chooseCallback = choose(attributes);

        CustomElement.observedAttributes = attrs;
        CustomElement.prototype.attributeChangedCallback = function(attribute, old, value) {
            if (value === old) { return; }
            chooseCallback.apply(this, arguments);
        };

        attrs.forEach(function(attribute) {
            Object.defineProperty(CustomElement.prototype, attribute, {
                get: function() {
                    return this.getAttribute(attribute) || '';
                },

                set: function(value) {
                    this.setAttribute(attribute, value);
                }
            });
        });
    }

    if (dom) {
        if (typeof dom === 'string') {
            // Todo dom is HTML string
            content = fragmentFromHTML(dom);
        }
        else {
            // Todo dom is fragment or node
            content = dom;
        }
    }

    window.customElements.define(name, CustomElement);
    return CustomElement;
}
