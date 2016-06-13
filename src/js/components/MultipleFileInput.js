cm.define('Com.MultipleFileInput', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-file-input',
        'max' : 0,                                  // 0 - infinity
        'local' : true,
        'buttonsAlign' : 'left',
        'inputConstructor' : 'Com.FileInput',
        'inputParams' : {
            'dropzone' : false,
            'local' : false,
            'fileManager' : false,
            'fileUploader' : false
        },
        'fileManager' : false,
        'fileManagerConstructor' : 'Com.AbstractFileManagerContainer',
        'fileManagerParams' : {
            'params' : {}
        },
        'fileUploader' : false,
        'fileUploaderConstructor' : 'Com.FileUploaderContainer',
        'fileUploaderParams' : {
            'params' : {}
        },
        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'rollover' : true
        },
        'langs' : {
            'browse' : 'Browse',
            'browse_local' : 'Browse Local',
            'browse_filemanager' : 'Browse File Manager'
        },
        'Com.FileReader' : {}
    }
},
function(params){
    var that = this;
    that.myNodes = {};
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
        that.itemAddEndHandler = that.itemAddEnd.bind(that);
        that.itemRemoveEndHandler = that.itemRemoveEnd.bind(that);
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        that.addEvent('onItemAddProcess', that.itemAddProcessHandler);
        that.addEvent('onItemAddEnd', that.itemAddEndHandler);
        that.addEvent('onItemRemoveEnd', that.itemRemoveEndHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        cm.removeClass(that.myNodes['browseHolder'], 'is-hidden');
        // Call parent method
        _inherit.prototype.clear.apply(that, arguments);
        return that;
    };

    classProto.getFiles = function(){
        var that = this,
            data = [],
            value;
        cm.forEach(that.items, function(item){
            value = (item['controller'] && item['controller'].getFile) ? item['controller'].getFile() : null;
            value && data.push(value);
        });
        return data;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            '_browse_local' : that.params['fileManager'] ? that.lang('browse_local') : that.lang('browse'),
            '_browse_filemanager' : that.params['local'] ? that.lang('browse_filemanager') : that.lang('browse')
        });
        // Components parameters
        that.params['dropzoneParams']['max'] = that.params['max'];
        that.params['fileManagerParams']['params']['max'] = that.params['max'];
        that.params['fileUploaderParams']['params']['max'] = that.params['max'];
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
                that.addItem({'value' : item}, true);
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
        if(that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.myComponents['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.myNodes['browseFileManager']
                    })
                );
                that.myComponents['fileManager'].addEvent('onSelect', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Uploader
        if(that.params['fileUploader']){
            cm.getConstructor(that.params['fileUploaderConstructor'], function(classObject){
                that.myComponents['fileUploader'] = new classObject(
                    cm.merge(that.params['fileUploaderParams'], {
                        'node' : that.myNodes['browseFileUploader']
                    })
                );
                that.myComponents['fileUploader'].addEvent('onSelect', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__multiple-file-input__content'},
            that.myNodes['content'] = cm.node('div', {'class' : 'pt__buttons'},
                that.myNodes['contentInner'] = cm.node('div', {'class' : 'inner'})
            )
        );
        cm.addClass(that.myNodes['content'], ['pull', that.params['buttonsAlign']].join('-'));
        // Render Browse Buttons
        if(that.params['local']){
            that.myNodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'class' : 'button button-primary'}, that.lang('_browse_local')),
                cm.node('div', {'class' : 'inner'},
                    that.myNodes['input'] = cm.node('input', {'type' : 'file', 'multiple' : that.isMultiple})
                )
            );
            cm.insertFirst(that.myNodes['browseLocal'], that.myNodes['contentInner']);
        }
        if(that.params['fileManager']){
            that.myNodes['browseFileManager'] = cm.node('button', {'class' : 'button button-primary'}, that.lang('_browse_filemanager'));
            cm.insertFirst(that.myNodes['browseFileManager'], that.myNodes['contentInner']);
        }
        if(that.params['fileUploader']){
            that.myNodes['browseFileUploader'] = cm.node('button', {'class' : 'button button-primary'}, that.lang('browse'));
            cm.insertFirst(that.myNodes['browseFileUploader'], that.myNodes['contentInner']);
        }
        if(!that.hasButtons){
            cm.addClass(that.myNodes['container'], 'is-hidden');
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.itemAddProcess = function(my, item){
        var that = this;
        item['controller'].addEvent('onClear', function(){
            that.removeItem(item);
        });
        return that;
    };

    classProto.itemAddEnd = function(){
        var that = this;
        if(that.params['max'] && (that.items.length == that.params['max'])){
            cm.addClass(that.myNodes['container'], 'is-hidden');
        }else if(that.hasButtons){
            cm.removeClass(that.myNodes['container'], 'is-hidden');
        }
        return that;
    };

    classProto.itemRemoveEnd = function(){
        var that = this;
        if(that.params['max'] && (that.items.length == that.params['max'])){
            cm.addClass(that.myNodes['container'], 'is-hidden');
        }else if(that.hasButtons){
            cm.removeClass(that.myNodes['container'], 'is-hidden');
        }
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
            that.addItem({'value' : data}, true);
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('multi-file-input', {
    'node' : cm.node('div'),
    'constructor' : 'Com.MultipleFileInput'
});