
test('.clone(textarea)', function() {
	var frag = dom.fragmentFromId('textarea-template');
	var copy = dom.clone(frag);
	var textarea = dom.query('textarea', copy)[0];

	// This is not true in IE, but at least the innerHTML does not display.
	//equals('', textarea.innerHTML);
	equals('', textarea.value);
});
