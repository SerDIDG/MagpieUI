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
            var item = that.validate({
                'file' : file
            });
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
        o = cm.merge({
            'file' : null,
            'value' : null,
            'error' : null,
            'name' : '',
            'size' : 0,
            'url' : null
        }, o);
        if(cm.isFile(o['file'])){
            o['name'] = o['file'].name;
            o['size'] = o['file'].size;
            o['url'] = window.URL.createObjectURL(o['file']);
        }else{
            o['name'] = cm.isEmpty(o['name']) ? o['value'] : o['name'];
            o['url'] = cm.isEmpty(o['url']) ? o['value'] : o['url'];
        }
        return o;
    };
});