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
        'onReadStart',
        'onReadProcess',
        'onReadSuccess',
        'onReadError',
        'onReadEnd'
    ],
    'params' : {
        'file' : null
    }
},
function(params){
    var that = this;
    that.isDestructed = false;
    that.nodes = {};
    that.components = {};
    that.construct(params);
});

cm.getConstructor('Com.FileReader', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        that.triggerEvent('onConstructStart');
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.triggerEvent('onRender');
        that.triggerEvent('onConstruct');
        that.triggerEvent('onConstructEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        that.read(that.params['file']);
        return that;
    };

    classProto.read = function(file){
        var that = this;
        if(cm.isFileReader && cm.isFile(file)){
            that.triggerEvent('onReadStart', file);
            // Config
            var item = that.validate(file);
            that.triggerEvent('onReadProcess', item);
            // Read File
            var reader = new FileReader();
            cm.addEvent(reader, 'load', function(e){
                item['value'] = e.target.result;
                that.triggerEvent('onReadSuccess', item);
                that.triggerEvent('onReadEnd', item);
            });
            cm.addEvent(reader, 'error', function(e){
                item['error'] = e;
                that.triggerEvent('onReadError', item);
                that.triggerEvent('onReadEnd', item);
            });
            reader.readAsDataURL(file);
        }
        return that;
    };

    classProto.validate = function(o){
        var that = this,
            item = {
                'value' : null,
                'error' : null,
                'name' : '',
                'size' : 0,
                'url' : null
            },
            parsed;
        if(cm.isFile(o)){
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