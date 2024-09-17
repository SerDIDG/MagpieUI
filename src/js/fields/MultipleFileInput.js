cm.define('Com.MultipleFileInput', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-file-input',
        'local' : true,
        'sortable' : false,
        'showToolbar' : true,
        'showControls' : false,
        'showList' : true,
        'focusInput' : false,
        'buttonsAlign' : 'left',
        'inputConstructor' : 'Com.FileInput',
        'inputParams' : {
            'embedStructure' : 'replace',
            'dropzone' : false
        },
        'fileManager' : false,
        'fileManagerConstructor' : 'Com.AbstractFileManagerContainer',
        'fileManagerParams' : {
            'constructorParams' : {}
        },
        'fileUploader' : false,
        'fileUploaderConstructor' : 'Com.FileUploaderContainer',
        'fileUploaderParams' : {
            'constructorParams' : {}
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'rollover' : true
        },
        'Com.FileReader' : {}
    },
    'strings' : {
        'browse' : 'Browse',
        'browse_local' : 'Browse Local',
        'browse_filemanager' : 'Browse File Manager'
    }
},
function(params){
    var that = this;
    that.myComponents = {};
    that.dragInterval = null;
    that.isDropzoneShow = false;
    that.hasButtons = false;
    // Call parent class construct
    Com.MultipleInput.apply(that, arguments);
});

cm.getConstructor('Com.MultipleFileInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.itemAddProcessHandler = that.itemAddProcess.bind(that);
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        that.addEvent('onItemAddProcess', that.itemAddProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        that.params['showToolbar'] && cm.removeClass(that.nodes['toolbar']['browseHolder'], 'is-hidden');
        // Call parent method
        _inherit.prototype.clear.apply(that, arguments);
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        // Validate Language Strings
        that.setLangs({
            '_browse_local' : that.params['fileManager'] ? that.lang('browse_local') : that.lang('browse'),
            '_browse_filemanager' : that.params['local'] ? that.lang('browse_filemanager') : that.lang('browse')
        });
        // Components parameters
        that.params['dropzoneParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['constructorParams']['max'] = that.params['max'];
        that.params['fileUploaderParams']['constructorParams']['max'] = that.params['max'];
        // File Uploader
        that.params['fileUploaderParams']['constructorParams']['local'] = that.params['local'];
        that.params['fileUploaderParams']['constructorParams']['fileManager'] = that.params['fileManager'];
        // Other
        that.params['dropzone'] = !that.params['local'] ? false : that.params['dropzone'];
        that.params['local'] = that.params['fileUploader'] ? false : that.params['local'];
        that.params['fileManager'] = that.params['fileUploader'] ? false : that.params['fileManager'];
        that.hasButtons = that.params['local'] || that.params['fileManager'] || that.params['fileUploader'];
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.myComponents['reader'] = new classObject(that.params[className]);
            that.myComponents['reader'].addEvent('onReadSuccess', function(my, item){
                that.addItem({'value' : item}, {
                    'triggerEvents' : true
                });
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.myComponents['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.nodes['inner'],
                        'target' : that.nodes['holder']
                    })
                );
                that.myComponents['dropzone'].addEvent('onDrop', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Manager
        if(that.params['showToolbar'] && that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.myComponents['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.nodes['toolbar']['browseFileManager']
                    })
                );
                that.myComponents['fileManager'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Uploader
        if(that.params['showToolbar'] && that.params['fileUploader']){
            cm.getConstructor(that.params['fileUploaderConstructor'], function(classObject){
                that.myComponents['fileUploader'] = new classObject(
                    cm.merge(that.params['fileUploaderParams'], {
                        'node' : that.nodes['toolbar']['browseFileUploader']
                    })
                );
                that.myComponents['fileUploader'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        return that;
    };

    classProto.renderToolbarView = function(){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__multiple-input__toolbar'},
            nodes['content'] = cm.node('div', {'class' : 'pt__buttons'},
                nodes['contentInner'] = cm.node('div', {'class' : 'inner'})
            )
        );
        cm.addClass(nodes['content'], ['pull', that.params['buttonsAlign']].join('-'));
        // Render Browse Buttons
        if(that.params['local']){
            nodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_local')),
                cm.node('div', {'class' : 'inner'},
                    nodes['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            that.isMultiple && nodes['input'].setAttribute('multiple', 'multiple');
            cm.insertFirst(nodes['browseLocal'], nodes['contentInner']);
        }
        if(that.params['fileManager']){
            nodes['browseFileManager'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_filemanager'));
            cm.insertFirst(nodes['browseFileManager'], nodes['contentInner']);
        }
        if(that.params['fileUploader']){
            nodes['browseFileUploader'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('browse'));
            cm.insertFirst(nodes['browseFileUploader'], nodes['contentInner']);
        }
        if(!that.hasButtons){
            cm.addClass(nodes['container'], 'is-hidden');
        }
        // Events
        cm.addEvent(nodes['input'], 'change', that.browseActionHandler);
        // Push
        that.nodes['toolbar'] = nodes;
        return nodes['container'];
    };

    classProto.itemAddProcess = function(my, item){
        var that = this;
        item['controller'].addEvent('onClear', function(){
            that.removeItem(item, {
                'triggerEvents' : true
            });
        });
        return that;
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
            that.myComponents['reader'].read(data);
        }else if(cm.isArray(data)){
            cm.forEach(data, function(file){
                that.processFiles(file);
            })
        }else if(!cm.isEmpty(data)){
            that.addItem({'value' : data}, {
                'triggerEvents' : true
            });
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.browse = function(){
        var that = this;
        if(that.params['local']){
            that.nodes['toolbar']['input'].click();
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('multi-file-input', {
    'node' : cm.node('div'),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.MultipleFileInput'
});
