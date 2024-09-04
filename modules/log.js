
import noop from 'fn/noop.js';

export default window.DEBUG ?
    function log(name, ...args) {
        if (window.console && window.console.log) {
            window.console.log('%cdom %c' + name + '%c', 'color: #888888; font-weight: 400;', 'color: #3a8ab0; font-weight: 600;', 'color: inherit; font-weight: 400;', ...args);
        }
    } :
    noop ;
