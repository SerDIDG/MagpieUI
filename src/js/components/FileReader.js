cm.define('Com.FileReader', {
    'modules' : [
        'Params',
        'Events',
        'Langs'
    ],
    'events' : [
        'onConstruct',
        'onConstructStart',
        'onConstructEnd',
        'onValidateParams',
        'onRenderStart',
        'onRender',
        'onRenderEnd',
        'onReadStart',
        'onReadProcess',
        'onReadSuccess',
        'onReadError',
        'onReadEnd'
    ],
    'params' : {
        'file' : null,
        'readOnRender' : true,
        'readValueType' : 'base64'         // base64 | binary | text | hex
    }
},
function(params){
    var that = this;
    that.construct(params);
});

cm.getConstructor('Com.FileReader', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        // Variables
        that.isDestructed = false;
        that.nodes = {};
        that.components = {};
        // Events
        that.triggerEvent('onConstructStart');
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.render();
        that.triggerEvent('onConstruct');
        that.triggerEvent('onConstructEnd');
    };

    classProto.render = function(){
        var that = this;
        that.triggerEvent('onRenderStart');
        if(that.params['readOnRender']){
            that.read(that.params['file']);
        }
        that.triggerEvent('onRender');
        that.triggerEvent('onRenderEnd');
    };

    classProto.readAsBase64 = function(file, callback){
        var that = this,
            item,
            reader;
        that.triggerEvent('onReadStart', file);
        // Config
        item = that.validate(file);
        that.triggerEvent('onReadProcess', item);
        // Read File
        reader = new FileReader();
        cm.addEvent(reader, 'load', function(e){
            that.afterSuccess(e.target.result, item, callback);
        });
        cm.addEvent(reader, 'error', function(e){
            that.afterError(e, item, callback);
        });
        reader.readAsDataURL(file);
        return that;
    };

    classProto.readAsBinary = function(file, callback){
        var that = this,
            item,
            reader;
        that.triggerEvent('onReadStart', file);
        // Config
        item = that.validate(file);
        that.triggerEvent('onReadProcess', item);
        // Read File
        reader = new FileReader();
        cm.addEvent(reader, 'load', function(e){
            that.afterSuccess(e.target.result, item, callback);
        });
        cm.addEvent(reader, 'error', function(e){
            that.afterError(e, item, callback);
        });
        reader.readAsBinaryString(file);
        return that;
    };

    classProto.readAsHEX = function(file, callback){
        var that = this,
            value,
            item,
            reader;
        that.triggerEvent('onReadStart', file);
        // Config
        item = that.validate(file);
        that.triggerEvent('onReadProcess', item);
        // Read File
        reader = new FileReader();
        cm.addEvent(reader, 'load', function(e){
            try{
                value = cm.bufferToHEX(e.target.result);
            }catch(e){
                that.afterError(e, item, callback);
            }finally{
                that.afterSuccess(value, item, callback);
            }
        });
        cm.addEvent(reader, 'error', function(e){
            that.afterError(e, item, callback);
        });
        reader.readAsArrayBuffer(file);
        return that;
    };

    classProto.readAsText = function(file, callback){
        var that = this,
            item,
            reader;
        that.triggerEvent('onReadStart', file);
        // Config
        item = that.validate(file);
        that.triggerEvent('onReadProcess', item);
        // Read File
        reader = new FileReader();
        cm.addEvent(reader, 'load', function(e){
            that.afterSuccess(e.target.result, item, callback);
        });
        cm.addEvent(reader, 'error', function(e){
            that.afterError(e, item, callback);
        });
        reader.readAsText(file);
        return that;
    };

    /******* HELPERS *******/

    classProto.afterSuccess = function(value, item, callback){
        var that = this;
        item['value'] = value;
        callback(item);
        that.triggerEvent('onReadSuccess', item);
        that.triggerEvent('onReadEnd', item);
        return item;
    };

    classProto.afterError = function(e, item, callback){
        var that = this;
        item['error'] = e;
        callback && callback(item);
        that.triggerEvent('onReadError', item);
        that.triggerEvent('onReadEnd', item);
        return item;
    };

    /******* PUBLIC *******/

    classProto.read = function(file, callback){
        var that = this;
        callback = cm.isFunction(callback) ? callback : function(){};
        if(cm.isFileReader && cm.isFile(file)) {
            switch (that.params['readValueType']) {
                case 'binary':
                    that.readAsBinary(file, callback);
                    break;
                case 'hex':
                    that.readAsHEX(file, callback);
                    break;
                case 'text':
                    that.readAsText(file, callback);
                    break;
                case 'base64':
                default:
                    that.readAsBase64(file, callback);
                    break;

            }
        }
        return that;
    };

    classProto.validate = function(o){
        var that = this,
            item = {
                '_type' : 'file',
                '_isFile' : false,
                'value' : null,
                'error' : null,
                'name' : '',
                'size' : 0,
                'url' : null,
                'type' : null
            },
            parsed;
        if(cm.isFile(o)){
            item['_isFile'] = true;
            item['file'] = o;
            item['type'] = o.type;
            item['name'] = o.name;
            item['size'] = o.size;
            item['url'] = window.URL.createObjectURL(o);
        }else if(cm.isObject(o)){
            item = cm.merge(item, o);
            item['name'] = cm.isEmpty(item['name']) ? item['value'] : item['name'];
            item['url'] = cm.isEmpty(item['url']) ? item['value'] : item['url'];
        }else if(!cm.isEmpty(o)){
            parsed = cm.parseJSON(o);
            if(cm.isObject(parsed)){
                item = that.validate(parsed);
            }else{
                item = that.validate({
                    'value' : o
                })
            }
        }
        return item;
    };
});
