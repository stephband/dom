/**
fragmentFromHTML(html)
Returns a DOM fragment of the parsed html `string`.
*/

export default function fragmentFromHTML(html, tag) {
    const range = document.createRange();

    if (tag) {
        const element = document.getElementsByTagName(tag).item(0);
        // TODO: this will fail if there is no tag of this type already 
        // in the DOM
        range.selectNode(element);
    }

    return range.createContextualFragment(html);
}
