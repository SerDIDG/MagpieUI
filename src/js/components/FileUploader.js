cm.define('Com.FileUploader', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect',
        'onComplete',
        'onGet'
    ],
    'params' : {
        'max' : 0,
        'showStats' : true,
        'completeOnSelect' : false,
        'local' : true,
        'localConstructor' : 'Com.FileUploaderLocal',
        'localParams' : {
            'embedStructure' : 'append'
        },
        'fileManagerLazy' : true,
        'fileManager' : true,
        'fileManagerConstructor' : 'Com.AbstractFileManager',
        'fileManagerParams' : {
            'embedStructure' : 'append',
            'showStats' : false,
            'fullSize' : true
        },
        'Com.Tabset' : {
            'embedStructure' : 'append',
            'toggleOnHashChange' : false,
            'calculateMaxHeight' : true
        },
        'Com.FileStats' : {
            'embedStructure' : 'append',
            'toggleBox' : false,
            'inline' : true
        },
        'langs' : {
            'tab_local' : 'Select From PC',
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
        that.completeHandler = that.complete.bind(that);
        // Add events
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(){
        var that = this,
            data;
        if(that.activeTab){
            switch(that.activeTab['id']){
                case 'local':
                    data = that.components['local'].get();
                    that.afterGet(data);
                    break;
                case 'fileManager':
                    that.components['fileManager'].get();
                    break;
            }
        }
        return that;
    };

    classProto.complete = function(){
        var that = this,
            data;
        if(that.activeTab){
            switch(that.activeTab['id']){
                case 'local':
                    data = that.components['local'].get();
                    that.afterComplete(data);
                    break;
                case 'fileManager':
                    that.components['fileManager'].complete();
                    break;
            }
        }
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Components parameters
        that.params['localParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['lazy'] = that.params['fileManagerLazy'];
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
        // Init Files Input
        if(that.params['local']){
            cm.getConstructor(that.params['localConstructor'], function(classObject){
                that.components['local'] = new classObject(
                    cm.merge(that.params['localParams'], {
                        'node' : that.nodes['local']['holder']
                    })
                );
                if(that.params['completeOnSelect']){
                    that.components['local'].addEvent('onSelect', function(my, data){
                        that.afterComplete(data);
                    });
                }
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
                that.components['fileManager'].addEvent('onGet', function(my, data){
                    that.afterGet(data);
                });
                that.components['fileManager'].addEvent('onComplete', function(my, data){
                    that.afterComplete(data);
                });
            });
        }
        // Init Tabset
        that.renderTabset();
        // Init Stats
        if(that.params['showStats']){
            cm.getConstructor('Com.FileStats', function(classObject, className){
                that.components['stats'] = new classObject(
                    cm.merge(that.params[className], {
                        'container' : that.nodes['content']
                    })
                );
            });
        }
        return that;
    };

    classProto.renderTabset = function(){
        var that = this;
        cm.getConstructor('Com.Tabset', function(classObject, className){
            that.components['tabset'] = new classObject(
                cm.merge(that.params[className], {
                    'container' : that.nodes['content']
                })
            );
            that.components['tabset'].addEvent('onTabShow', function(my, data){
                that.activeTab = data;
                if(that.activeTab['id'] == 'fileManager'){
                    that.components['fileManager'] && that.components['fileManager'].load();
                }
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
            nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__local-container'},
                nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'})
            )
        );
        return nodes;
    };

    classProto.renderFileManager = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['li'] = cm.node('li',
            nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__file-manager is-fullsize'},
                nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'})
            )
        );
        return nodes;
    };

    /* *** AFTER EVENTS *** */

    classProto.afterGet = function(data){
        var that = this;
        that.items = data;
        that.triggerEvent('onGet', that.items);
        return that;
    };

    classProto.afterComplete = function(data){
        var that = this;
        that.items = data;
        that.triggerEvent('onComplete', that.items);
        return that;
    };
});