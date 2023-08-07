
/**
toPrefetchPromise(url)
Generate a promise of <link rel="preload"> load state for each URL. Currently
supports prefetching stylesheets only. (TODO: Parse url for file extension)
**/

import cache         from '../../../fn/modules/cache.js';
import create        from '../create.js';
import toLoadPromise from './to-load-promise.js';

export default cache((url) => {
    if (!url || url.includes('undefined')) {
        throw new Error('ERRR?')
    }
    const link    = create('link', { rel: 'preload', as: 'style', href: url });
    const promise = toLoadPromise(link);
    document.head.append(link);
    return promise;
});
