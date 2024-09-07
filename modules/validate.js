
/**
validate(element)
Validates an element using `.checkValidity()` on that element, or by finding and
running checkValidity on the element's descendents.
**/

const selector = 'input, select, textarea, [value]';

export default function validate(node) {
	// Fieldsets lie and always return `true` on calling checkValidity() because
	// 'they are not candidats for constraint validation'. This is bonkers, of
	// course, as they behave differently forms, which check the validity of
	// their content. Make them report the validity of their children.
    return node.checkValidity && !(node instanceof HTMLFieldSetElement) ? node.checkValidity() :
		node.hasChildNodes() ? Array.from(node.querySelectorAll(selector)).every(validate) :
		true ;
}
