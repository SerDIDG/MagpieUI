cm.define('Com.FileUploaderLocal', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect'
    ],
    'params' : {
        'max' : 0,
        'fileList' : true,
        'fileListConstructor' : 'Com.MultipleFileInput',
        'fileListParams' : {
            'local' : false,
            'dropzone' : false,
            'fileManager' : false,
            'fileUploader' : false,
            'embedStructure' : 'append'
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'rollover' : false
        },
        'showOverlay' : true,
        'overlayDelay' : 'cm._config.loadDelay',
        'Com.Overlay' : {
            'autoOpen' : false,
            'removeOnClose' : true,
            'showSpinner' : true,
            'showContent' : false,
            'position' : 'absolute',
            'theme' : 'light'
        },
        'Com.FileReader' : {},
        'langs' : {
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
    that.isMultiple = false;
    that.isProccesing = false;
    that.overlayDelay = null;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileUploaderLocal', function(classConstructor, className, classProto){
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
        that.params['fileListParams']['max'] = that.params['max'];
        that.params['dropzoneParams']['max'] = that.params['max'];
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-uploader__local'},
            that.nodes['holder'] = cm.node('div', {'class' : 'com__file-uploader__holder'},
                cm.node('div', {'class' : 'pt__buttons pull-center'},
                    cm.node('div', {'class' : 'inner'},
                        cm.node('div', {'class' : 'browse-button'},
                            cm.node('button', {'type' : 'button','class' : 'button button-primary button--xlarge'}, that.lang('browse_local')),
                            cm.node('div', {'class' : 'inner'},
                                that.nodes['input'] = cm.node('input', {'type' : 'file'})
                            )
                        )
                    )
                )
            )
        );
        if(that.params['dropzone']){
            that.nodes['dropzoneHolder'] = cm.node('div', {'class' : 'com__file-uploader__holder'},
                cm.node('div', {'class' : 'com__file-uploader__title'}, that.lang('or')),
                that.nodes['dropzone'] = cm.node('div', {'class' : 'com__file-uploader__dropzone'})
            );
            cm.appendChild(that.nodes['dropzoneHolder'], that.nodes['container']);
        }
        if(that.params['fileList']){
            that.nodes['files'] = cm.node('div', {'class' : 'com__file-uploader__files is-hidden'});
            cm.appendChild(that.nodes['files'], that.nodes['container']);
        }
        that.isMultiple && that.nodes['input'].setAttribute('multiple', 'multiple');
        // Events
        that.triggerEvent('onRenderViewProcess');
        cm.addEvent(that.nodes['input'], 'change', that.browseActionHandler);
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['overlay'] = new classConstructor(
                cm.merge(that.params[className], {
                    'container' : that.nodes['container']
                })
            );
        });
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.components['reader'] = new classObject(that.params[className]);
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.components['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.nodes['dropzone']
                    })
                );
                that.components['dropzone'].addEvent('onSelect', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init Files Input
        if(that.params['fileList']){
            cm.getConstructor(that.params['fileListConstructor'], function(classObject){
                that.components['fileList'] = new classObject(
                    cm.merge(that.params['fileListParams'], {
                        'node' : that.nodes['files']
                    })
                );
                that.components['fileList'].addEvent('onItemAddEnd', function(){
                    if(that.components['fileList'].get().length){
                        cm.removeClass(that.nodes['files'], 'is-hidden');
                    }
                });
                that.components['fileList'].addEvent('onItemRemoveEnd', function(){
                    if(!that.components['fileList'].get().length){
                        cm.addClass(that.nodes['files'], 'is-hidden');
                    }
                });
            });
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            length = that.params['max'] ? Math.min(e.target.files.length, (that.params['max'] - that.items.length)) : e.target.files.length,
            data = [];
        cm.preventDefault(e);
        cm.forEach(length, function(i){
            data.push(e.target.files[i]);
        });
        that.processFiles(data);
        return that;
    };

    classProto.processFiles = function(data){
        var that = this,
            length = data.length;
        // Show Overlay
        if(that.params['showOverlay']){
            that.overlayDelay = setTimeout(function(){
                if(that.components['overlay'] && !that.components['overlay'].isOpen){
                    that.components['overlay'].open();
                }
            }, that.params['overlayDelay']);
        }
        // Process
        cm.forEach(data, function(file, i){
            that.components['reader'].read(file, function(item){
                that.items[i] = item;
                if(cm.getLength(that.items) === length){
                    that.finalizeFiles();
                }
            });
        });
        return that;
    };

    classProto.finalizeFiles = function(){
        var that = this;
        // Render Files List
        if(that.components['fileList']){
            that.renderFileList();
        }
        // Hide Overlay
        if(that.params['showOverlay']){
            that.overlayDelay && clearTimeout(that.overlayDelay);
            if(that.components['overlay'] && that.components['overlay'].isOpen){
                that.components['overlay'].close();
            }
        }
        // Trigger events
        that.triggerEvent('onSelect', that.items);
        return that;
    };

    classProto.renderFileList = function(){
        var that = this;
        cm.forEach(that.items, function(item){
            that.components['fileList'].addItem({'value' : item}, true);
        });
        return that;
    };
});