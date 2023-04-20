
const isWebkit  = /Webkit/i.test(navigator.userAgent);
const isChrome  = /Chrome/i.test(navigator.userAgent);
const isiOS     = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

export default isWebkit && (isiOS || !isChrome);
