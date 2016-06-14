cm.define('Com.elFinderFileManager', {
    'extend' : 'Com.AbstractFileManager',
    'params' : {
        'config' : {
            url : '',
            lang : {},
            dotFiles : false,
            useBrowserHistory : false,
            resizable : false,
            commandsOptions : {
                getfile : {
                    folders : false,
                    multiple : false
                }
            }
        }
    }
},
function(params){
    var that = this;
    that.processType = null;
    that.processCallback = null;
    // Call parent class construct
    Com.AbstractFileManager.apply(that, arguments);
});

cm.getConstructor('Com.elFinderFileManager', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.selectFileEventHandler = that.selectFileEvent.bind(that);
        that.getFilesEventHandler = that.getFilesEvent.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(callback){
        var that = this;
        that.processType = 'get';
        that.processCallback = callback || function(){};
        // Get files
        if(that.components['controller']){
            that.components['controller'].exec('getfile');
        }else{
            _inherit.prototype.get.apply(that, arguments);
        }
        return null;
    };

    classProto.getFiles = function(callback){
        var that = this;
        that.processType = 'getFiles';
        that.processCallback = callback || function(){};
        // Get files
        if(that.components['controller']){
            that.components['controller'].exec('getfile');
        }else{
            _inherit.prototype.getFiles.apply(that, arguments);
        }
        return null;
    };

    classProto.complete = function(callback){
        var that = this;
        that.processType = 'complete';
        that.processCallback = callback || function(){};
        // Get files
        if(that.components['controller']){
            that.components['controller'].exec('getfile');
        }else{
            _inherit.prototype.complete.apply(that, arguments);
        }
        return that.items;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init elFinder
        if(typeof elFinder != 'undefined'){
            that.components['controller'] = new elFinder(that.nodes['holder']['inner'],
                cm.merge(that.params['config'], {
                    commandsOptions : {
                        getfile : {
                            multiple: that.isMultiple
                        }
                    },
                    getFileCallback : that.getFilesEventHandler
                })
            );
            // elFinder does not return path of selected file
            //that.components['controller'].bind('select', that.selectFileEventHandler);
            // Show
            cm.removeClass(that.nodes['holder']['container'], 'is-hidden');
            that.components['controller'].show();
        }else{
            cm.errorLog({
                'name' : that._name['full'],
                'message' : ['elFinder does not exists.'].join(' ')
            });
        }
        return that;
    };

    classProto.getFilesEvent = function(data){
        var that = this;
        that.processFiles(data);
        switch(that.processType){
            case 'get':
                _inherit.prototype.get.call(that, that.processCallback);
                break;
            case 'getFiles':
                _inherit.prototype.getFiles.call(that, that.processCallback);
                break;
            case 'complete':
                _inherit.prototype.complete.call(that, that.processCallback);
                break;
            default:
                _inherit.prototype.complete.call(that);
                break;

        }
        that.processType = null;
        return that;
    };

    classProto.selectFileEvent = function(e){
        var that = this,
            selected = e.data.selected,
            files = [],
            file;
        if(selected.length){
            cm.forEach(selected, function(item){
                file = that.components['controller'].file(item);
                file && files.push(file);
            });
        }
        that.processFiles(files);
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