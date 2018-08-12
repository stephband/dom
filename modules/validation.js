export function isValid(node) {
	return node.validity ? node.validity.valid : true ;
}

export function validate(node) {
    return node.checkValidity ? node.checkValidity() : true ;
}
