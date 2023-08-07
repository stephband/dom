
import get        from '../../fn/modules/get.js';
import last       from '../../fn/modules/last.js';
import select     from '../../dom/modules/select.js';
import isTextNode from '../../dom/modules/is-text-node.js';

// Prevent orphans at the end of paragraphs and headings
select('h1, h2, h3, h4, h5, h6, p, li', document.body)
.map(get('childNodes'))
.map(last)
.filter(isTextNode)
.forEach((node) =>
    node.textContent = node.textContent.replace(/\s+(\S+)\s*$/, ($0, $1) =>
        // Insert no breaking space
        '\u00A0' + $1
    )
);
