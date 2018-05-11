
(function(window) {
    var Fn  = window.Fn;
    var dom = window.dom;
    if(document.body.clientWidth < 480) {
        return
    }
    // Prevent orphans at the end of paragraphs and headings
    dom('h1, h2, h3, h4, h5, h6, p, li')
    .map(Fn.get('childNodes'))
    .map(Fn.last)
    .filter(dom.isTextNode)
    .forEach(function(node) {
        node.textContent = node.textContent.replace(/(\s+)([\S]+)$/, function($0, $1, $2) {
            // Insert no breaking space
            return '\u00A0' + $2;
        });
    });
})(this);
