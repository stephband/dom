
/**
setDataTransfer(mimetypes, options)
**/

export function setDataTransfer(dataTransfer, datas, options) {
    for (let mimetype in datas){
        try {
            dataTransfer.setData(mimetype, datas[mimetype]);
            options && assign(dataTransfer, options);
        }
        catch(e) {
            if (window.DEBUG) {
                console.warn('dataTransfer: mimetype "' + mimetype + '" can\'t be set.');
            }
        }
    }
}
