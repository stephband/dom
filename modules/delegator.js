
const assign = Object.assign;

/** 
Delegator(handlers)

Takes an object map of handler functions keyed to selectors, and returns an 
object with a `handleEvent()` method ready to be used as an event handler. 
Functions are passed the target node and the event object.

```
const delegator = new Delegator({
    'button': (target, e) => {}
})
```
**/

export default function Delegator(handlers = {}) {
    this.handlers  = handlers;
    this.selectors = Object.keys(handlers);
}

assign(Delegator.prototype, {
    handleEvent: function(e) {
        const target = e.target;
        let n = -1;
        let selector;
        while (selector = this.selectors[++n]) {
            const node = target.closest(selector);
            if (node) {
                return this.handlers[selector](node, e);
            }
        }
    }
});
