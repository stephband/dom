
import noop from '../../fn/modules/noop.js';

const DEBUG = window.DEBUG && window.console && window.console.log;

export default DEBUG ?
    function log(name, ...args) {
        if (window.console && window.console.log) {
            window.console.log('%cdom %c' + name + '%c', 'color: #888888; font-weight: 400;', 'color: #3a8ab0; font-weight: 600;', 'color: inherit; font-weight: 400;', ...args);
         }
    } :
    noop ;
