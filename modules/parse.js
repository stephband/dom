
var mimetypes = {
    xml:  'application/xml',
    html: 'text/html',
    svg:  'image/svg+xml'
};

export default function parse(type, string) {
    if (!string) { return; }

    // Accept 'svg' or 'SVG' or 'image/svg+xml'
    var mimetype = mimetypes[type.toLowerCase()] || type;
    var xml;

    // Cludged from jQuery source...
    try {
        xml = (new window.DOMParser()).parseFromString(string, mimetype);
    }
    catch (e) {
        return;
    }

    if (!xml || xml.getElementsByTagName("parsererror").length) {
        throw new Error("Invalid " + type.toUpperCase() + ": " + string);
    }

    return xml;
}

/**
parseHTML(string)
Returns an HTML document parsed from `string`, or undefined.
*/

export function parseHTML(string) {
    return parse('html', string);
}

/**
parseSVG(string)
Returns an SVG document parsed from `string`, or undefined.
*/

export function parseSVG(string) {
    return parse('svg', string);
}

/**
parseXML(string)
Returns an XML document parsed from `string`, or undefined.
*/

export function parseXML(string) {
    return parse('xml', string);
}
