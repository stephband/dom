import style from './style.js';

const define = Object.defineProperties;

export default define({
    left: 0
}, {
    right:  { get: function() { return window.innerWidth; }, enumerable: true, configurable: true },
    top:    { get: function() { return style('padding-top', document.body); }, enumerable: true, configurable: true },
    bottom: { get: function() { return window.innerHeight; }, enumerable: true, configurable: true }
});
