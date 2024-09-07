
import run    from 'fn/test.js';
import events from '../events.js';
import { trigger } from '../trigger.js';

const assign = Object.assign;
const create = Object.create;


run('events()', ['ping', 'ping', 1, 'done'], function(test, done) {
    const pings = events('ping', document.body);

    trigger('ping', document.body);

    setTimeout(() => {
        pings
        .slice(0, 2)
        .each((e) => test(e.type))
        .done(() => test(1));

        trigger('ping', document.body);
        trigger('ping', document.body);
        trigger('ping', document.body);

        test(pings.status);
        done();
    }, 50);
});
