cm.define('Com.FileUploader', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect'
    ],
    'params' : {
        'max' : 0,
        'local' : true,
        'inputConstructor' : 'Com.MultipleFileInput',
        'inputParams' : {
            'local' : false,
            'dropzone' : false,
            'fileManager' : false,
            'fileUploader' : false,
            'embedStructure' : 'append'
        },
        'fileManager' : true,
        'fileManagerConstructor' : 'Com.AbstractFileManager',
        'fileManagerParams' : {
            'embedStructure' : 'append'
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'rollover' : false
        },
        'Com.Tabset' : {
            'embedStructure' : 'append',
            'toggleOnHashChange' : false
        },
        'Com.FileReader' : {},
        'langs' : {
            'tab_local' : 'Upload Local',
            'tab_filemanager' : 'File Manager',
            'browse_local_single' : 'Choose file',
            'browse_local_multiple' : 'Choose files',
            'or' : 'or',
            'browse' : 'Browse'
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.items = [];
    that.activeTab = null;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileUploader', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(){
        var that = this;
        if(that.activeTab){
            switch(that.activeTab['id']){
                case 'local':
                    that.items = that.components['local'].getFiles();
                    break;
                case 'fileManager':
                    that.items = that.components['fileManager'].get();
                    break;
            }
        }
        return that.items || [];
    };

    classProto.select = function(){
        var that = this;
        that.items = that.get();
        that.triggerEvent('onSelect', that.items);
        return that.items;
    };

    classProto.validateParams = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        // Validate Language Strings
        that.setLangs({
            'browse_local' : !that.params['max'] || that.params['max'] > 1 ? that.lang('browse_local_multiple') : that.lang('browse_local_single')
        });
        // Components parameters
        that.params['inputParams']['max'] = that.params['max'];
        that.params['dropzoneParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['max'] = that.params['max'];
        // Other
        that.params['dropzone'] = !that.params['local'] ? false : that.params['dropzone'];
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-uploader'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['content'] = cm.node('div', {'class' : 'com__file-uploader__content'})
            )
        );
        // Local
        if(that.params['local']){
            that.nodes['local'] = that.renderLocal();
        }
        // File Manager
        if(that.params['fileManager']){
            that.nodes['fileManager'] = that.renderFileManager();
        }
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.components['reader'] = new classObject(that.params[className]);
            that.components['reader'].addEvent('onReadSuccess', function(my, data){
                that.components['local'].addItem({'value' : data}, true);
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.components['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.nodes['local']['dropzone']
                    })
                );
                that.components['dropzone'].addEvent('onDrop', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init Files Input
        if(that.params['local']){
            cm.getConstructor(that.params['inputConstructor'], function(classObject){
                that.components['local'] = new classObject(
                    cm.merge(that.params['inputParams'], {
                        'node' : that.nodes['local']['files']
                    })
                );
                that.components['local'].addEvent('onItemAddEnd', function(){
                    if(that.components['local'].get().length){
                        cm.removeClass(that.nodes['local']['files'], 'is-hidden');
                    }
                });
                that.components['local'].addEvent('onItemRemoveEnd', function(){
                    if(!that.components['local'].get().length){
                        cm.addClass(that.nodes['local']['files'], 'is-hidden');
                    }
                });
            });
        }
        // Init File Manager
        if(that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.components['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.nodes['fileManager']['holder']
                    })
                );
            });
        }
        // Init Tabset
        cm.getConstructor('Com.Tabset', function(classObject, className){
            that.components['tabset'] = new classObject(
                cm.merge(that.params[className], {
                    'container' : that.nodes['content']
                })
            );
            that.components['tabset'].addEvent('onTabShow', function(my, data){
                that.activeTab = data;
            });
            if(that.params['local']){
                that.components['tabset'].addTab({
                    'id' : 'local',
                    'title' : that.lang('tab_local'),
                    'content' : that.nodes['local']['li']
                });
            }
            if(that.params['fileManager']){
                that.components['tabset'].addTab({
                    'id' : 'fileManager',
                    'title' : that.lang('tab_filemanager'),
                    'content' : that.nodes['fileManager']['li']
                });
            }
            that.components['tabset'].set(that.params['local'] ? 'local' : 'fileManager');
        });
        return that;
    };

    classProto.renderLocal = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['li'] = cm.node('li',
            nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__local'},
                nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'},
                    cm.node('div', {'class' : 'pt__buttons pull-center'},
                        cm.node('div', {'class' : 'inner'},
                            cm.node('div', {'class' : 'browse-button'},
                                cm.node('button', {'class' : 'button button-primary button--xlarge'}, that.lang('browse_local')),
                                cm.node('div', {'class' : 'inner'},
                                    nodes['input'] = cm.node('input', {'type' : 'file', 'multiple' : that.isMultiple})
                                )
                            )
                        )
                    )
                ),
                cm.node('div', {'class' : 'com__file-uploader__title'}, that.lang('or')),
                nodes['dropzone'] = cm.node('div', {'class' : 'com__file-uploader__dropzone'}),
                nodes['files'] = cm.node('div', {'class' : 'com__file-uploader__files is-hidden'})
            )
        );
        // Events
        cm.addEvent(nodes['input'], 'change', that.browseActionHandler);
        return nodes;
    };

    classProto.renderFileManager = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['li'] = cm.node('li',
            nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__file-manager'},
                nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'})
            )
        );
        return nodes;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            length = that.params['max'] ? Math.min(e.target.files.length, (that.params['max'] - that.items.length)) : e.target.files.length;
        cm.forEach(length, function(i){
            that.processFiles(e.target.files[i]);
        });
        return that;
    };

    classProto.processFiles = function(data){
        var that = this;
        if(cm.isFile(data)){
            that.components['reader'].read(data);
        }else if(cm.isArray(data)){
            cm.forEach(data, function(file){
                that.processFiles(file);
            })
        }else if(!cm.isEmpty(data)){
            that.components['local'].addItem({'value' : data}, true);
        }
        return that;
    };
});