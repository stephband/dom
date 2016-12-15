
function createTestNode(html) {
	var testTable = document.createElement('table');
	var testBody  = document.createElement('tbody');

	testBody.innerHTML = html;
	testTable.appendChild(testBody);
	document.body.appendChild(testTable);

	return testBody;	
}

function createTestTemplate(html) {
	var test = document.createElement('template');
	test.innerHTML = html;
	document.body.appendChild(test);
	return test;	
}

function createTestScript(html, tag) {
	var test = document.createElement('script');
	test.type = 'text/html';
	test.innerHTML = html;
	test.setAttribute('data-parent-tag', tag);
	document.body.appendChild(test);
	return test;	
}

test('.fragmentFromChildren(node)', function() {
	var test = createTestNode('<tr><td>Hello <span>span</span>.</td></tr>   \t\t  ');
	var fragment = dom.fragmentFromChildren(test);

	// All nodes from testBody were moved
	equals(0, test.childNodes.length);

	// Fragment is a fragment
	equals(11, fragment.nodeType);

	// They are both in fragment, in order
	equals(2, fragment.childNodes.length);
	equals(1, fragment.childNodes[0].nodeType);
	equals(3, fragment.childNodes[1].nodeType);
});

test('.fragmentFromHTML(html, [tag])', function() {
	var fragment = dom.fragmentFromHTML('<tr><td>Hello <span>span</span>.</td></tr>   \t\t  ', 'tbody');

	// Fragment is a fragment
	equals(11, fragment.nodeType);

	// HTML is in the fragment
	equals(2, fragment.childNodes.length);
	equals(1, fragment.childNodes[0].nodeType);
	equals(3, fragment.childNodes[1].nodeType);
});

test('.fragmentFromTemplate(node)', function() {
	var test = createTestTemplate('<div>Hello <span>span</span>.</div>   \t\t  ');
	var fragment = dom.fragmentFromTemplate(test);

	// Fragment is a fragment
	equals(11, fragment.nodeType);

	// HTML is in the fragment
	equals(2, fragment.childNodes.length);
	equals(1, fragment.childNodes[0].nodeType);
	equals(3, fragment.childNodes[1].nodeType);
});

test('.fragmentFromId(id)', function() {
	console.log('testing <template> ...');

	var test = createTestTemplate('<div>Hello <span>span</span>.</div>   \t\t  ');
	var id   = dom.identify(test);
	var fragment = dom.fragmentFromId(id);

	// Fragment is a fragment
	equals(11, fragment.nodeType);

	// HTML is in the fragment
	equals(2, fragment.childNodes.length);
	equals(1, fragment.childNodes[0].nodeType);
	equals(3, fragment.childNodes[1].nodeType);


	console.log('testing <script type="text/html"> ...');

	test = createTestScript('<tr><td>Hello <span>span</span>.</td></tr>   \t\t  ', 'tbody');
	id = dom.identify(test);
	fragment = dom.fragmentFromId(id);

	// Fragment is a fragment
	equals(11, fragment.nodeType);

	// HTML is in the fragment
	equals(2, fragment.childNodes.length);
	equals(1, fragment.childNodes[0].nodeType);
	equals(3, fragment.childNodes[1].nodeType);
});
