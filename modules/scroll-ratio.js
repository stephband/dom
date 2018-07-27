export default function scrollRatio(node) {
	return node.scrollTop / (node.scrollHeight - node.clientHeight);
};
