
import create from './create.js';

const assign = Object.assign;

export default function DOM() {
    this.length = 0;  
}

assign(DOM, {
    of: () => new DOM(),
    from: () => new DOM()
});

assign(DOM.prototype, {
    toString: function() {
        var string = '';
        var n = -1;
        while (this[++n]) { string += this[n].outerHTML; }
        return string;
    },

    forEach: Array.prototype.forEach,

    valueOf: function() {
        var fragment = create('fragment');
        var n = -1;
        while (this[++n]) { fragment.appendChild(this[n]); }
        console.log('DOM.valueOf()!', fragment);
        return fragment;
    }
});

[
    'a', 'article',
    'b', 'div', 
    'i', 
    'li', 'link',
    'nav',
    'p', 
    'section', 'slot', 'span', 
    'table', 'tbody', 'td', 'th', 'thead', 'time', 'tr', 
    'ul', 
    'video'
].forEach((name) => {
    // new DOM().p(props)
    DOM.prototype[name] = function(properties) {
        this[this.length] = create(name, properties);
        this.length++;
        return this;
    };

    // DOM.p(props)
    DOM[name] = function(properties, children) {
        return new DOM()[name](properties);
    };
});
