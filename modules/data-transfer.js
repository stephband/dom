
/**
setDataTransfer(mimetypes, options)
**/

const assign = Object.assign;

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
