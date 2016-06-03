cm.define('Com.elFinderFileManager', {
    'extend' : 'Com.AbstractFileManager',
    'params' : {
        'config' : {
            url : '',
            lang : {},
            dotFiles : false,
            destroyOnClose : true,
            useBrowserHistory : false,
            commandsOptions : {
                getfile : {
                    oncomplete: 'close',
                    folders : false,
                    multiple : false
                }
            }
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractFileManager.apply(that, arguments);
});

cm.getConstructor('Com.elFinderFileManager', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.selectFileEventHandler = that.selectFileEvent.bind(that);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.select = function(){
        var that = this;
        if(that.components['controller']){
            that.components['controller'].exec('getfile')
        }else{
            that.triggerEvent('onSelect', that.items);
        }
        return that.items;
    };

    classProto.render = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.render.apply(that, arguments);
        // Init elFinder
        if(typeof elFinder != 'undefined'){
            that.components['controller'] = new elFinder(that.nodes['holder'], cm.merge(that.params['config'], {
                commandsOptions : {
                    getfile : {
                        multiple: that.isMultiple
                    }
                },
                getFileCallback : function(data) {
                    that.processFiles(data);
                }
            }));
            that.components['controller'].bind('select', that.selectFileEventHandler);
            that.components['controller'].show();
        }else{
            cm.errorLog({
                'name' : that._name['full'],
                'message' : ['elFinder does not exists.'].join(' ')
            });
        }
        return that;
    };

    classProto.selectFileEvent = function(e){
        var that = this,
            selected = e.data.selected,
            files = [],
            file,
            max;
        if(selected.length){
            cm.forEach(selected, function(item){
                file = that.components['controller'].file(item);
                file && files.push(file);
            });
        }
        if(!that.params['max']){
            that.items = files;
        }else if(files.length){
            max = Math.min(0, that.params['max'], files.length);
            that.items = files.slice(0, max);
        }else{
            that.items = [];
        }
    };

    classProto.convertFile = function(data){
        if(!data || data['mime'] == 'directory'){
            return false;
        }
        return {
            'value' : data['url'],
            'name' : data['name'],
            'mime' : data['mime'],
            'size' : data['size'],
            'url' : data['url']
        }
    };
});