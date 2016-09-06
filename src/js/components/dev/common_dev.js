cm.addScript = function(src, async, callback){
    var vars = {
        '%baseUrl%' : cm._baseUrl,
        '%assetsUrl%' : cm._assetsUrl || cm._baseUrl
    };
    // Config
    src = cm.isArray(src) ? cm.objectReplace(src, vars) : cm.strReplace(src, vars);
    async = typeof async != 'undefined' ? async : false;
    callback = typeof callback != 'undefined' ? callback : function(){};
    // Handler
    var handler = function(item){

        var script = document.createElement('script');
        script.src = src;
        script.async = async;
        cm.addEvent(script, 'load', callback);
        cm.addEvent(script, 'error', callback);
        cm.appendChild(script, cm.getDocumentHead());
    };
    // Process
    if(cm.isArray(src)){
        var length = src.length;
        cm.forEach(src, function(item){
            handler(item);
            that.components['reader'].read(file, function(item){
                that.items[i] = item;
                if(cm.getLength(that.items) === length){
                    that.finalizeFiles();
                }
            });
        });
    }else{

    }
    return true;
    var script = document.createElement('script');
    script.src = src;
    script.async = async;
    cm.addEvent(script, 'load', callback);
    cm.addEvent(script, 'error', callback);
    cm.appendChild(script, cm.getDocumentHead());
    return script;
};