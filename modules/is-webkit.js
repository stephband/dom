var isWebkit  = /Webkit/i.test(navigator.userAgent);
var isChrome  = /Chrome/i.test(navigator.userAgent);
var isiOS     = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

export default isWebkit && (isiOS || !isChrome);
