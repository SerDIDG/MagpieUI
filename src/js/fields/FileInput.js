cm.define('Com.FileInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'embedStructure' : 'replace',
        'hiddenType' : 'textarea',

        'className' : 'com__file-input',
        'size' : 'full',                     // default, full, custom
        'showLink' : true,
        'showFilename' : true,
        'showClearButton' : true,
        'autoOpen' : false,
        'placeholder' : null,
        'buttonsAdaptive' : false,

        'defaultValue' : '',
        'accept' : [],                      // empty - accept all, example: ['image/png', 'image/jpeg']
        'readValueType' : 'base64',         // base64 | binary
        'outputValueType' : 'object',       // file | object

        'local' : true,
        'fileManager' : false,
        'fileManagerConstructor' : 'Com.AbstractFileManagerContainer',
        'fileManagerParams' : {
            'constructorParams' : {
                'max' : 1
            }
        },

        'fileUploader' : false,
        'fileUploaderConstructor' : 'Com.FileUploaderContainer',
        'fileUploaderParams' : {
            'constructorParams' : {
                'max' : 1
            }
        },

        'dropzone' : true,
        'dropzoneConstructor' : 'Com.FileDropzone',
        'dropzoneParams' : {
            'embedStructure' : 'append',
            'max' : 1,
            'rollover' : true
        },

        'fileReaderConstructor' : 'Com.FileReader',
        'fileReaderParams' : {
            'readOnRender': false
        }
    },
    'strings' : {
        'browse' : 'Browse',
        'browse_local' : 'Browse Local',
        'browse_filemanager' : 'Browse File Manager',
        'remove' : 'Remove',
        'open' : 'Open',
        'errors': {
            'accept': 'This file type is not accepted'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.FileInput', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onInitComponentsStart = function(){
        var that = this;
        cm.getConstructor(that.params['fileReaderConstructor'], function(classObject){
            that.components['validator'] = new classObject(that.params['fileReaderParams']);
        });
    };

    classProto.onValidateParamsEnd = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            '_browse_local' : that.params['fileManager'] ? that.lang('browse_local') : that.lang('browse'),
            '_browse_filemanager' : that.params['local'] ? that.lang('browse_filemanager') : that.lang('browse')
        });
        // Dropzone
        that.params['dropzone'] = !that.params['local'] ? false : that.params['dropzone'];
        // File Uploader
        that.params['fileUploaderParams']['openOnConstruct'] = that.params['autoOpen'];
        that.params['fileUploaderParams']['constructorParams']['local'] = that.params['local'];
        that.params['fileUploaderParams']['constructorParams']['fileManager'] = that.params['fileManager'];
        // Other
        that.params['fileReaderParams']['readValueType'] = that.params['readValueType'];
        that.params['local'] = that.params['fileUploader'] ? false : that.params['local'];
        that.params['fileManagerParams']['openOnConstruct'] = that.params['autoOpen'];
        that.params['fileManager'] = that.params['fileUploader'] ? false : that.params['fileManager'];
    };

    classProto.onReset = function(){
        var that = this;
        // Release file object url to clear from memory
        that.releaseFileURL();
    };

    classProto.onDestruct = function(){
        var that = this;
        // Release file object url to clear from memory
        that.releaseFileURL();
    };

    /*** VIEW MODEL ***/

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Init FilerReader
        cm.getConstructor(that.params['fileReaderConstructor'], function(classObject){
            that.components['reader'] = new classObject(that.params['fileReaderParams']);
            that.components['reader'].addEvent('onReadSuccess', function(my, item){
                that.set(item, true);
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.components['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'disabled' : that.params['disabled'],
                        'container' : that.nodes['content']['inner'],
                        'target' : that.nodes['content']['content']
                    })
                );
                that.components['dropzone'].addEvent('onDrop', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Manager
        if(that.params['fileManager']){
            cm.getConstructor(that.params['fileManagerConstructor'], function(classObject){
                that.components['fileManager'] = new classObject(
                    cm.merge(that.params['fileManagerParams'], {
                        'node' : that.nodes['content']['browseFileManager']
                    })
                );
                that.components['fileManager'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
        // Init File Uploader
        if(that.params['fileUploader']){
            cm.getConstructor(that.params['fileUploaderConstructor'], function(classObject){
                that.components['fileUploader'] = new classObject(
                    cm.merge(that.params['fileUploaderParams'], {
                        'node' : that.nodes['content']['browseFileUploader']
                    })
                );
                that.components['fileUploader'].addEvent('onComplete', function(my, data){
                    that.processFiles(data);
                });
            });
        }
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-input__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'},
                nodes['content'] = cm.node('div', {'class' : 'com__file-input__holder'},
                    nodes['buttons'] = cm.node('div', {'class' : 'pt__file-line'},
                        nodes['buttonsInner'] = cm.node('div', {'class' : 'inner'},
                            nodes['clear'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('remove')),
                            nodes['label'] = cm.node('div', {'class' : 'label'}),
                            nodes['placeholder'] = cm.node('div', {'class' : 'label label-placeholder', 'innerHTML' : that.params['placeholder']})
                        )
                    )
                )
            )
        );
        // Adaptive
        if(that.params['buttonsAdaptive']){
            cm.addClass(nodes['buttons'], 'is-adaptive');
        }
        // Clear button
        if(!that.params['showClearButton']){
            cm.addClass(nodes['clear'], 'is-hidden');
        }
        // Render Browse Buttons
        if(that.params['local']){
            nodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_local')),
                cm.node('div', {'class' : 'inner'},
                    nodes['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            if(!cm.isEmpty(that.params.accept) && cm.isArray(that.params.accept)){
                nodes['input'].accept = that.params['accept'].join(',');
            }
            cm.addEvent(nodes['input'], 'change', that.browseActionHandler);
            cm.insertFirst(nodes['browseLocal'], nodes['buttonsInner']);
        }
        if(that.params['fileManager']){
            nodes['browseFileManager'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('_browse_filemanager'));
            cm.insertFirst(nodes['browseFileManager'], nodes['buttonsInner']);
        }
        if(that.params['fileUploader']){
            nodes['browseFileUploader'] = cm.node('button', {'type' : 'button', 'class' : 'button button-primary'}, that.lang('browse'));
            cm.insertFirst(nodes['browseFileUploader'], nodes['buttonsInner']);
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['clear'], 'click', that.clearEventHandler);
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            file = e.target.files[0];
        cm.preventDefault(e);
        // Read File
        that.processFiles(file);
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
            that.set(data, true);
        }
        return that;
    };

    classProto.releaseFileURL = function(){
        var that = this;
        if(!cm.isEmpty(that.value) && !cm.isEmpty(that.value['url'])){
            window.URL.revokeObjectURL(that.value['url']);
        }
    };

    classProto.isAcceptableFileFormat = function(item){
        var that = this,
            isValid = true;
        if (
            cm.isEmpty(that.params.accept) || !cm.isArray(that.params.accept) ||
            cm.isEmpty(item) || cm.isEmpty(item.file)
        ) {
            isValid = true;
        } else {
            isValid = cm.inArray(that.params.accept, item.type);
        }
        if (that.params.formField) {
            if (!isValid) {
                that.params.formField.renderError(that.msg('errors.accept'));
            } else {
                that.params.formField.clearError();
            }
        }
        return isValid;
    };

    /* *** DATA *** */

    classProto.get = function(){
        var that = this,
            value;
        if(that.params['outputValueType'] === 'file'){
            value = that.value['file'] || that.value['value'] || that.value || '';
        }else{
            value = that.value  || '';
        }
        return value;
    };

    classProto.validateValue = function(value){
        var that = this,
            item = that.components.validator.validate(value);
        if (
            (cm.isEmpty(item.value) && cm.isEmpty(item.file))
            || !that.isAcceptableFileFormat(item)
        ) {
            return that.params.defaultValue;
        }
        return item;
    };

    classProto.setData = function(){
        var that = this;
        if(cm.isEmpty(that.value)){
            if(!cm.isEmpty(that.params['placeholder'])){
                cm.removeClass(that.nodes['content']['placeholder'], 'is-hidden');
            }else{
                cm.addClass(that.nodes['content']['placeholder'], 'is-hidden');
            }
            cm.clearNode(that.nodes['content']['label']);
            cm.addClass(that.nodes['content']['label'], 'is-hidden');
            if(that.params['showClearButton']){
                cm.removeClass(that.nodes['content']['browseLocal'], 'is-hidden');
                cm.removeClass(that.nodes['content']['browseFileManager'], 'is-hidden');
                cm.removeClass(that.nodes['content']['browseFileUploader'], 'is-hidden');
                cm.addClass(that.nodes['content']['clear'], 'is-hidden');
            }
        }else{
            cm.addClass(that.nodes['content']['placeholder'], 'is-hidden');
            cm.clearNode(that.nodes['content']['label']);
            cm.removeClass(that.nodes['content']['label'], 'is-hidden');
            if(that.params['showFilename']){
                if(that.params['showLink']){
                    that.nodes['content']['link'] = cm.node('a', {'target' : '_blank', 'href' : that.value['url'], 'title' : that.lang('open')}, that.value['name']);
                }else{
                    that.nodes['content']['link'] = cm.textNode(that.value['name']);
                }
                cm.appendChild(that.nodes['content']['link'], that.nodes['content']['label']);
            }
            if(that.params['showClearButton']){
                cm.addClass(that.nodes['content']['browseLocal'], 'is-hidden');
                cm.addClass(that.nodes['content']['browseFileManager'], 'is-hidden');
                cm.addClass(that.nodes['content']['browseFileUploader'], 'is-hidden');
                cm.removeClass(that.nodes['content']['clear'], 'is-hidden');
            }
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.browse = function(){
        var that = this;
        if(that.params['local']){
            that.nodes['content']['input'].click();
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('file', {
    'node' : cm.node('input', {'type' : 'text'}),
    'value' : '',
    'defaultValue' : '',
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.FileInput'
});
