/**
scrollRatio(node)
Return the ratio of scrollTop to scrollHeight - clientHeight.
*/

export default function scrollRatio(node) {
	return node.scrollTop / (node.scrollHeight - node.clientHeight);
};
