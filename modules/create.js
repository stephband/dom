
import id       from '../../fn/modules/id.js';
import overload from '../../fn/modules/overload.js';
import assign   from './assign.js';

const svgNamespace = 'http://www.w3.org/2000/svg';

const template      = document.createElement('template');
const typeofContent = (type, content) => (content && typeof content);

// Constructors

function createContextFragment(context, html = '') {
    const range = document.createRange();
    range.selectNode(context);
    return range.createContextualFragment(html);
}

const createSVG = overload(typeofContent, {
    string: function(tag, html) {
        const node = document.createElementNS(svgNamespace, tag);
        node.innerHTML = html;
        return node;
    },

    object: function(tag, object) {
        const node = document.createElementNS(svgNamespace, tag);

        // Is it array-like?
        if (typeof object.length === 'number') {
            // Be careful here in case object is a live NodeList, which will
            // mutate as you iterate over it. Applying object to .append()
            // appears to not have this problem, and will work on arrays.
            node.append.apply(node, object);
        }
        else {
            assign(node, object);
        }

        return node;
    },

    default: (tag) => document.createElementNS(svgNamespace, tag)
});

const createHTML = overload(typeofContent, {
    string: function(tag, html) {
        const node = document.createElement(tag);
        node.innerHTML = html;
        return node;
    },

    object: function(tag, object) {
        const node = document.createElement(tag);

        // Is it array-like?
        if (typeof object.length === 'number') {
            // Be careful here in case object is a live NodeList, which will
            // mutate as you iterate over it. Applying object to .append()
            // appears to not have this problem, and will work on arrays.
            node.append.apply(node, object);
        }
        else {
            assign(node, object);
        }

        return node;
    },

    default: (tag) => document.createElement(tag)
});

/**
create(tag, content)

Constructs and returns a new DOM node.

- If `tag` is `"text"` a text node is created.
- If `tag` is `"fragment"` a fragment is created.
- If `tag` is `"comment"` a comment is created.
- If `tag` is any other string the element `<tag></tag>` is created.

Where a comment or text node is created `content` must be a string, as is set as
textContent. For fragments and other nodes:

- If `content` is a string it is set as innerHTML.
- If `content` is array-like its items are appended to node. Note that where
`content` is a NodeList, this removes nodes from whatever the NodeList belongs
to.
- If `content` is an object its properties are assigned as node properties or
attributes.

##### `create(tag, content, context)`

Where `tag` is `fragment` there is an optional third parameter `context`, which
must be an element. The fragment parser is run in the context of this element.

```
create('fragment', '<li>', create('ul'));
```
**/

const create = overload(id, {
    comment: function(tag, text) {
        return document.createComment(text || '');
    },

    fragment: overload(typeofContent, {
        string: function(tag, html, context) {
            if (context) {
                return createContextFragment(context, html);
            }

            template.innerHTML = html;
            return template.content.cloneNode(true);
        },

        object: function(tag, object, context) {
            // If there is context, create a context-aware fragment
            const fragment = context ?
                createContextFragment(context) :
                document.createDocumentFragment() ;

            // Is object array-like?
            if (typeof object.length === 'number') {
                // Be careful here in case object is a live NodeList, which will
                // mutate as you iterate over it. Applying object to .append()
                // appears to not have this problem, and will work on arrays.
                fragment.append.apply(fragment, object);
            }
            else {
                assign(fragment, object);
            }

            return fragment;
        },

        default: () => document.createDocumentFragment()
    }),

    text: function (tag, text) {
        return document.createTextNode(text || '');
    },

    circle:   createSVG,
    ellipse:  createSVG,
    g:        createSVG,
    glyph:    createSVG,
    image:    createSVG,
    line:     createSVG,
    rect:     createSVG,
    use:      createSVG,
    path:     createSVG,
    pattern:  createSVG,
    polygon:  createSVG,
    polyline: createSVG,
    svg:      createSVG,
    tspan:    createSVG,

    default:  createHTML
});

export default create;


// Expose to console in DEBUG mode
if (window.DEBUG) {
    Object.assign(window.dom || (window.dom = {}), { create });
}
