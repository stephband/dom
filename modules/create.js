
import id       from '../../fn/modules/id.js';
import overload from '../../fn/modules/overload.js';
import assign   from './assign.js';

const svgNamespace = 'http://www.w3.org/2000/svg';

const div           = document.createElement('div');
const typeofTag     = (tag, content)  => (tag && typeof tag);
const typeofContent = (type, content) => (content && typeof content);

// Constructors

function createContextFragment(context, html) {
    const range = document.createRange();
    range.selectNode(context);
    return range.createContextualFragment(html);
}

function createSVG(tag, html) {
    var node = document.createElementNS(svgNamespace, tag);

    if (html) {
        node.innerHTML = html;
    }

    return node;
}

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

Where node is a fragment there is an optional third parameter `context`, which
must be an element. The fragment parser is run in the context of the element:

```
create('fragment', '<li>', document.querySelector('ul'));
```
**/

export default overload(id, {
    comment: function(tag, text) {
        return document.createComment(text || '');
    },

    fragment: overload(typeofContent, {
        string: function(tag, html, context) {
            if (context) {
                return createContextFragment(context, html);
            }

            const fragment = document.createDocumentFragment();
            div.innerHTML = html;
            const nodes = div.childNodes;
            while (nodes[0]) { fragment.appendChild(nodes[0]); }
            return fragment;
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

    default: overload(typeofContent, {
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

        default: (tag) => {
            if (typeof tag !== 'string') {
                // We used to support object as first argument. Deprecated.
                // Todo: remove this message when we dont see any more errors
                throw new Error('create(tag, content) accepts only a string as tag "' + (typeof tag) + '"')
            }

            return document.createElement(tag);
        }
    }),
});


/*
I believe this is redundant. Was it in Sparky that we created nodes with an
object as first argument? */
/*
export default overload(typeofTag, {
    string: create,

    object: function(properties, content) {
        const tag = properties.tag || properties.tagName;

        if (window.DEBUG && typeof tag !== 'string') {
            throw new Error('create(object, content) object must have string property .tag or .tagName');
        }

        return typeof content === 'string' ?
            assign(create(tag, properties), { innerHTML: content }) :
            assign(create(tag, properties), content) ;
    },

    default: window.DEBUG && function(tag) {
        throw new Error('create(tag, content) does not accept tag type "' + (typeof tag) + '"');
    }
});
*/
