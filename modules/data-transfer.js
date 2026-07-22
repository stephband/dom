
import id     from 'fn/id.js';
import choose from 'fn/choose.js';
import { parseHTML, parseSVG, parseXML } from './parse.js';


const assign    = Object.assign;
const parseData = choose({
    'application/json': JSON.parse,
    'application/xml':  parseXML,
    'text/html':        parseHTML,
    'image/svg+xml':    parseSVG,
    default: id
});


/**
setDataTransfer(dataTransfer, mimetypes, options)
**/
export function setDataTransfer(dataTransfer, datas, options) {
    for (let mimetype in datas){
        try {
            //console.log('Set ' + mimetype, datas[mimetype]);
            dataTransfer.setData(mimetype, datas[mimetype]);
            options && assign(dataTransfer, options);
        }
        catch(e) {
            if (window.DEBUG) {
                console.warn('dataTransfer: mimetype "' + mimetype + '" can\'t be set.', e);
            }
        }
    }
}


/**
getDataTransfer(dataTransfer, mimetypes)
**/
export function getDataTransfer(dataTransfer, types) {
    const datatypes = dataTransfer.types;
    if (!datatypes.length) return;

    const mimetypes = types.filter(type => datatypes.includes(type));
    if (!mimetypes.length) return;

    // Types should be declared in order of preference. Here we take data
    // from the first mimetype that matches with some data
    let n = -1, mimetype, data;
    while (mimetype = mimetypes[++n]) {
        const string = dataTransfer.getData(mimetype);
        if (!string) continue;
        data = parseData(mimetype, string);
        break;
    }

    return data;
}
