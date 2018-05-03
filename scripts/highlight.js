(function() {
    // Find code elements with an attribute code="html|sparky|js|css" and
    // insert a highlighted code block in front of it.

    var Fn    = window.Fn;
    var dom   = window.dom;
    var Prism = window.Prism;

    var attribute = dom.attribute;
    var before    = dom.before;
    var clone     = dom.clone;
    var create    = dom.create;
    var overload  = Fn.overload;
    var query     = dom.query;
    var remove    = dom.remove;

    Prism.languages.django.property.pattern = /(?:{\[)[\s\S]*?(?:]})/g;

    dom('[code]')
    .map(overload(attribute('code'), {
        html: function(node) {
            var dummy = clone(node);

            // For some reason textContent of <pre> does not necessarily
            // start with a new line. Gaurantee new lines in <pre>s!
            query('pre', dummy)
            .forEach(function(node) {
                var first = node.childNodes[0];
                if (!/^\n/.test(first.textContent)) {
                    first.textContent = '\n' + first.textContent;
                }
            });

            var html   = dummy.innerHTML;
            var indent = (/\s*\n([ \t]*)/.exec(html) || [])[1];

            // Remove indentation from original node
            var fragment = create('fragment', node.innerHTML.replace(RegExp(indent, 'g'), ''));
            var first    = fragment.childNodes[0];
            before(node, fragment);
            remove(node);

            html = html
            // Remove leading space and lines
            .replace(/\s*\n([ \t]*)/, '')
            // Remove indentation
            .replace(RegExp('\n' + indent, 'g'), '\n')
            // Remove trailing space and lines
            .replace(/\s*\n([ \t]*)$/, '');

            var code = Prism.highlight(html, Prism.languages.sparky);
            return {
                node: first,
                code: create('code', { class: 'html-code block', 'sparky-fn': 'stop', innerHTML: code })
            };
        },

        js: function(node) {
            var js = node.innerHTML;
            var indent = (/\n([ \t]*)$/.exec(js) || [])[1];
            js = js.replace(RegExp('^\s*\n' + indent), '');
            js = js.replace(RegExp('\n' + indent, 'g'), '\n');
            var code = Prism.highlight(js, Prism.languages.javascript);
            return {
                node: node,
                code: create('code', { class: 'js-code block', 'sparky-fn': 'stop', innerHTML: code })
            };
        },

        css: function(node) {
            var js = node.innerHTML;
            var indent = (/\n([ \t]*)$/.exec(html) || [])[1];
            js = js.replace(RegExp('\n' + indent, 'g'), '\n');
            var code = Prism.highlight(js, Prism.languages.javascript);
            return {
                node: node,
                code: create('code', { class: 'css-code block', 'sparky-fn': 'stop', innerHTML: code })
            };
        }
    }))
    .forEach(function(object) {
        var node = object.node;
        var code = object.code;
        before(node, code);
    });
})();
