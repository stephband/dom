

/**
prefix(string)
Returns a prefixed CSS property name where a prefix is required in the current
browser.
*/

const prefixes = ['Khtml','O','Moz','Webkit','ms'];

var node = document.createElement('div');
var cache = {};

function testPrefix(prop) {
    if (prop in node.style) { return prop; }

    var upper = prop.charAt(0).toUpperCase() + prop.slice(1);
    var l = prefixes.length;
    var prefixProp;

    while (l--) {
        prefixProp = prefixes[l] + upper;

        if (prefixProp in node.style) {
            return prefixProp;
        }
    }

    return false;
}

export default function prefix(prop){
    return cache[prop] || (cache[prop] = testPrefix(prop));
}
