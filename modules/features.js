import cache from '../../fn/modules/cache.js';
import prefix from './prefix.js';

const define = Object.defineProperties;

/**
features

An object of feature detection results.

```
{
    inputEventsWhileDisabled: true, // false in FF, where disabled inputs don't trigger events
    template: true,                 // false in old browsers where template.content not found
    textareaPlaceholderSet: true,   // false in IE, where placeholder is also set on innerHTML
    transition: true,               // false in older browsers where transitions not supported
    fullscreen: true,               // false where fullscreen API not supported
    scrollBehavior: true,           // Whether scroll behavior CSS is supported
    events: {
        fullscreenchange: 'fullscreenchange',
        transitionend:    'transitionend'
    }
}
```
*/

export default define({
    events: define({}, {
        fullscreenchange: {
            get: cache(function() {
                // TODO: untested event names
                return ('fullscreenElement' in document) ? 'fullscreenchange' :
                ('webkitFullscreenElement' in document) ? 'webkitfullscreenchange' :
                ('mozFullScreenElement' in document) ? 'mozfullscreenchange' :
                ('msFullscreenElement' in document) ? 'MSFullscreenChange' :
                'fullscreenchange' ;
            }),

            enumerable: true
        },

        transitionend: {
            // Infer transitionend event from CSS transition prefix

            get: cache(function() {
                var end = {
                    KhtmlTransition: false,
                    OTransition: 'oTransitionEnd',
                    MozTransition: 'transitionend',
                    WebkitTransition: 'webkitTransitionEnd',
                    msTransition: 'MSTransitionEnd',
                    transition: 'transitionend'
                };

                var prefixed = prefix('transition');
                return prefixed && end[prefixed];
            }),

            enumerable: true
        }
    })
}, {
    inputEventsWhileDisabled: {
        // FireFox won't dispatch any events on disabled inputs:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=329509

        get: cache(function() {
            var input     = document.createElement('input');
            var testEvent = Event('featuretest');
            var result    = false;

            document.body.appendChild(input);
            input.disabled = true;
            input.addEventListener('featuretest', function(e) { result = true; });
            input.dispatchEvent(testEvent);
            input.remove();

            return result;
        }),

        enumerable: true
    },

    template: {
        get: cache(function() {
            // Older browsers don't know about the content property of templates.
            return 'content' in document.createElement('template');
        }),

        enumerable: true
    },

    textareaPlaceholderSet: {
        // IE sets textarea innerHTML (but not value) to the placeholder
        // when setting the attribute and cloning and so on. The twats have
        // marked it "Won't fix":
        //
        // https://connect.microsoft.com/IE/feedback/details/781612/placeholder-text-becomes-actual-value-after-deep-clone-on-textarea

        get: cache(function() {
            var node = document.createElement('textarea');
            node.setAttribute('placeholder', '---');
            return node.innerHTML === '';
        }),

        enumerable: true
    },

    transition: {
        get: cache(function testTransition() {
            var prefixed = prefix('transition');
            return prefixed || false;
        }),

        enumerable: true
    },

    fullscreen: {
        get: cache(function testFullscreen() {
            var node = document.createElement('div');
            return !!(node.requestFullscreen ||
                node.webkitRequestFullscreen ||
                node.mozRequestFullScreen ||
                node.msRequestFullscreen);
        }),

        enumerable: true
    },

    scrollBehavior: {
        get: cache(function() {
            return 'scrollBehavior' in document.documentElement.style;
        })
    },

    scrollBarWidth: {
        get: cache(function() {
            // TODO

            /*
            let scrollBarWidth;
                        
            function testScrollBarWidth() {
                if (scrollBarWidth) { return scrollBarWidth; }
            
                const inner = create('div', {
                    style: 'display: block; width: auto; height: 60px; background: transparent;'
                });
            
                const test = create('div', {
                    style: 'overflow: scroll; width: 30px; height: 30px; position: absolute; bottom: 0; right: 0; background: transparent; z-index: -1;',
                    children: [inner]
                });
            
                document.body.appendChild(test);
                scrollBarWidth = test.offsetWidth - inner.offsetWidth;
                test.remove();
                return scrollBarWidth;
            }
            */

        })
    }
});
