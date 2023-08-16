
export default function isValid(node) {
	return node.validity ? node.validity.valid : true ;
}
