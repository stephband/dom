
import { Observer, nothing, requestTick } from '../../fn/module.js';
import { evaluate, inputEvent, invert, transform, transformOutput, transformTick, transformUnit  } from './control.js';
import { element } from '../module.js';
import Sparky, { mount } from '../../sparky/module.js';

const DEBUG = false;//window.DEBUG === undefined || window.DEBUG;

const assign = Object.assign;

const defaults = {
    path: './components/controls',
    transform: 'linear',
    min:    0,
    max:    1
};

const mountSettings = {
    mount: function(node, options) {
        // Does the node have Sparkyfiable attributes?
        const attrFn = node.getAttribute(options.attributeFn);
        //const attrInclude = node.getAttribute(options.attributeSrc);

        if (!attrFn/* && !attrInclude*/) { return; }

        options.fn = attrFn;
        //options.include = attrInclude;
        var sparky = Sparky(node, options);

        // This is just some help for logging
        sparky.label = 'Sparky (<range-control> tick)';

        // Return sparky
        return sparky;
    },

    attributePrefix:  ':',
    attributeFn:      'fn'
};

function createTicks(data, tokens) {
    return tokens ?
        tokens
        .split(/\s+/)
        .map(evaluate)
        .filter((number) => {
            // Filter ticks to min-max range, special-casing logarithmic-0
            // which travels to 0 whatever it's min value
            return number >= (data.transform === 'linear-logarithmic' ? 0 : data.min)
                && number <= data.max
        })
        .map((value) => {
            // Freeze to tell mounter it's immutable, prevents
            // unnecessary observing
            return Object.freeze({
                root:         data,
                value:        value,
                tickValue:    invert(data.transform, value, data.min, data.max),
                displayValue: transformTick(data.unit, value)
            });
        }) :
        nothing ;
}

element('range-control', {

    shadow: '#range-control-template',

    attributes: {
        min:       function(value) { this.min = value; },

        max:       function(value) { this.max = value; },

        value:     function(value) { this.value = value; },

        prefix:    function(value) { this.data.prefix = value; },

        transform: function(value) { this.data.transform = value; },

        unit:      function(value) { this.data.unit = value; },

        ticks: function(value) {
            const data     = this.data;
            const observer = Observer(data);
            observer.ticks = createTicks(data, value);
        }
    },

    properties: {
        type: {
            value: 'number',
            enumerable: true
        },

        min: {
            get: function() {
                return this.data.min;
            },

            set: function(value) {
                const data = this.data;
                value = evaluate(value);

                if (value === data.min) { return; }

                const observer = Observer(data);
                observer.min   = evaluate(value);

                // Check for readiness
                if (data.max === undefined || data.value === undefined) { return; }

                observer.ticks = createTicks(data, this.getAttribute('ticks') || '');
                observer.inputValue = invert(data.transform, data.value, data.min, data.max);
            },

            enumerable: true
        },

        max: {
            get: function() {
                return this.data.max;
            },

            set: function(value) {
                const data = this.data;
                value = evaluate(value);

                if (value === data.max) { return; }

                const observer = Observer(data);
                observer.max   = evaluate(value);

                // Check for readiness
                if (data.min === undefined || data.value === undefined) { return; }

                observer.ticks = createTicks(data, this.getAttribute('ticks') || '');
                observer.inputValue = invert(data.transform, data.value, data.min, data.max);
            },

            enumerable: true
        },

        value: {
            get: function() {
                return this.data.value;
            },

            set: function(value) {
                const data = this.data;
                value = evaluate(value);

                if (value === data.value) { return; }
                data.value = value;

                const observer = Observer(data);

                if (data.max === undefined || data.min === undefined) { return; }

                // Todo: set value is being called from within a Sparky frame,
                // which is normal, but it's messing with the renderer cueing for
                // range-control's inner Sparky mounting. I think cueing needs to
                // improve, with data updates being done in one round and all
                // render processes delayed by a tick. I'm not sure. Anyway, as
                // a bodge job, we delay by a tick here. This may mean DOM update
                // values are a frame behind. Investigate.
                requestTick(() => {
                    observer.displayValue = transformOutput(data.unit, value);
                    observer.displayUnit  = transformUnit(data.unit, value);
                    observer.inputValue   = invert(data.transform, value, data.min, data.max);
                });
            },

            enumerable: true
        }
    },

    construct: function(shadow) {
        this.data = assign({}, defaults);
    },

    connect: function() {
        if (DEBUG) { console.log('<range-control> added to document', this.value, this.data); }

        const data     = this.data;
        const observer = Observer(data);

        // Mount template
        mount(this.shadowRoot, mountSettings).push(data);

        // Pick up input events and update scope - Sparky wont do this
        // currently as events are delegated to document, and these are in
        // a shadow DOM.
        this.shadowRoot.addEventListener('input', (e) => {
            const data       = this.data;
            const inputValue = parseFloat(e.target.value);

            observer.inputValue = inputValue;

            const value = transform(data.transform, inputValue, data.min, data.max) ;
            data.value = value;

            observer.displayValue = transformOutput(data.unit, value);
            observer.displayUnit  = transformUnit(data.unit, value);

            if (e.target.checked) {
                // Uncheck tick radio so that it may be chosen again
                // Should not be necessary - target should become
                // unchecked if value moves away
                //e.target.checked = false;

                // Focus the input
                this.shadowRoot
                .getElementById('input')
                .focus();
            }

            // 'input' events are suppsed to traverse the shadow boundary
            // but they do not. At least not in Chrome 2019 - a
            if (!e.composed) {
                console.warn('Custom element not allowing input event to traverse shadow boundary');
                this.dispatchEvent(inputEvent);
            }
        });
    }
})
