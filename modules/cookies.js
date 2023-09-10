function decodeCookie(s) {
    return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
}

export function getCookie(key) {
	var cookies = document.cookie ? document.cookie.split('; ') : [];
    var i, parts;

	for (i = 0; i < cookies.length; i++) {
		parts = cookies[i].split('=');

		try {
			if (key === decodeCookie(parts[0])) {
                return decodeCookie(parts.slice(1).join('='));
			}
		}
        catch (e) {}
	}
}

export function setCookie(name, time, value) {
    var expires = "";
    if (time) {
        var date = new Date();
        date.setTime(date.getTime() + (time * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}


// Expose to console in DEBUG mode
if (window.DEBUG) {
    Object.assign(window.dom || (window.dom = {}), { getCookie });
}
