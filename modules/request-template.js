
import cache         from '../../fn/modules/cache.js';
import { parseHTML } from './parse.js';
import { request }   from './request.js';

const requestDocument = cache(function requestDocument(path) {
    return request('GET', path)
    .then(parseHTML);
});

export default function requestTemplate(src) {
    const parts = src.split('#');
    const path  = parts[0] || '';
    const id    = parts[1] || '';

    if (!path) {
        throw new Error('dom requestTemplate(src) src "' + src + '" does not contain a path');
    }

    return id ?
        requestDocument(path)
        .then((doc) => doc.getElementById(id))
        .then((template) => {
            if (!template) {
                throw new Error('dom requestTemplate(src) template "' + src + '" not found in imported document');
            }

            return document.adoptNode(template);
        }) :

        requestDocument(path)
        .then((doc) => document.adoptNode(doc.body)) ;
}
