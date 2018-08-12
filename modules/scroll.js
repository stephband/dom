// disableScroll(node)
//
// Disables scrolling without causing node's content to jump

export function disableScroll(node) {
	node = node || document.documentElement;

	var scrollLeft = node.scrollLeft;
	var scrollTop  = node.scrollTop;

	// Remove scrollbars from the documentElement
	//docElem.css({ overflow: 'hidden' });
	node.style.overflow = 'hidden';

	// FF has a nasty habit of linking the scroll parameters
	// of document with the documentElement, causing the page
	// to jump when overflow is hidden on the documentElement.
	// Reset the scroll position.
	if (scrollTop)  { node.scrollTop = scrollTop; }
	if (scrollLeft) { node.scrollLeft = scrollLeft; }

	// Disable gestures on touch devices
	//add(document, 'touchmove', preventDefaultOutside, layer);
}

// enableScroll(node)
//
// Enables scrolling without causing node's content to jump

export function enableScroll(node) {
	node = node || document.documentElement;

	var scrollLeft = node.scrollLeft;
	var scrollTop  = node.scrollTop;

	// Put scrollbars back onto docElem
	node.style.overflow = '';

	// FF fix. Reset the scroll position.
	if (scrollTop) { node.scrollTop = scrollTop; }
	if (scrollLeft) { node.scrollLeft = scrollLeft; }

	// Enable gestures on touch devices
	//remove(document, 'touchmove', preventDefaultOutside);
}
