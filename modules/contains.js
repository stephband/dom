export default function contains(child, node) {
	return node.contains ?
		node.contains(child) :
	child.parentNode ?
		child.parentNode === node || contains(child.parentNode, node) :
	false ;
}
