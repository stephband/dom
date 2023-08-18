
/**
validate(element)
Validates an element using `.checkValidity()` on that element, or by finding and
running checkValidity on the element's descendents.
**/

// TODO: Need a better way of finding validateable elements, which may now
// include any form-enabled custom element
const selector = 'input, select, textarea';

export default function validate(node) {
    return node.checkValidity ? node.checkValidity() :
		node.hasChildNodes() ? Array.from(node.querySelectorAll(selector)).every(validate) :
		true ;
}
