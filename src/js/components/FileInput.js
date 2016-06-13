cm.define('Com.FileInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__file-input',
        'file' : null,
        'showLink' : true,
        'local' : true,
        'fileManager' : false,
        'fileManagerConstructor' : 'Com.AbstractFileManagerContainer',
        'fileManagerParams' : {
            'params' : {
                'max' : 1
            }
        },
        'fileUploader' : false,
        'fileUploaderConstructor' : 'Com.FileUploaderContainer',
        'fileUploaderParams' : {
            'params' : {
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
        'langs' : {
            'browse' : 'Browse',
            'browse_local' : 'Browse Local',
            'browse_filemanager' : 'Browse File Manager',
            'remove' : 'Remove',
            'open' : 'Open'
        },
        'Com.FileReader' : {}
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.myComponents = {};
    that.rawValue = null;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.FileInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.initComponentsStartHandler = that.initComponentsStart.bind(that);
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        // Add events
        that.addEvent('onInitComponentsStart', that.initComponentsStartHandler);
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.set.apply(that, arguments);
        // Set data
        that.setData();
        return that;
    };

    classProto.clear = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.clear.apply(that, arguments);
        // Set data
        that.setData();
        return that;
    };

    classProto.getFile = function(){
        var that = this;
        return that.rawValue;
    };

    classProto.initComponentsStart = function(){
        var that = this;
        cm.getConstructor('Com.FileReader', function(classObject){
            that.myComponents['validator'] = new classObject();
        });
        return that;
    };

    classProto.constructProcess = function(){
        var that = this;
        that.set(that.rawValue, false);
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            '_browse_local' : that.params['fileManager'] ? that.lang('browse_local') : that.lang('browse'),
            '_browse_filemanager' : that.params['local'] ? that.lang('browse_filemanager') : that.lang('browse')
        });
        // Validate Value
        if(!cm.isEmpty(that.params['file'])){
            if(cm.isEmpty(that.params['file']['value'])){
                if(cm.isObject(that.params['value'])){
                    that.params['file']['value'] = that.params['value']['value'];
                }else{
                    that.params['file']['value'] = that.params['value'];
                }
            }
            that.rawValue = that.myComponents['validator'].validate(that.params['file']);
        }else if(cm.isObject(that.params['value'])){
            that.rawValue = that.myComponents['validator'].validate(that.params['value']);
        }else if(!cm.isEmpty(that.params['value'])){
            that.rawValue = that.myComponents['validator'].validate({
                'value' : that.params['value']
            });
        }else{
            that.rawValue = that.myComponents['validator'].validate();
        }
        // Other
        that.params['dropzone'] = !that.params['local'] ? false : that.params['dropzone'];
        that.params['local'] = that.params['fileUploader'] ? false : that.params['local'];
        that.params['fileManager'] = that.params['fileUploader'] ? false : that.params['fileManager'];
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        if(cm.isObject(value)){
            that.rawValue = that.myComponents['validator'].validate(value);
        }else if(!cm.isEmpty(value)){
            that.rawValue = that.myComponents['validator'].validate({
                'value' : value
            });
        }else{
            that.rawValue = that.myComponents['validator'].validate();
        }
        return that.rawValue['value'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.myComponents['reader'] = new classObject(that.params[className]);
            that.myComponents['reader'].addEvent('onReadSuccess', function(my, item){
                that.set(item, true);
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor(that.params['dropzoneConstructor'], function(classObject){
                that.myComponents['dropzone'] = new classObject(
                    cm.merge(that.params['dropzoneParams'], {
                        'container' : that.myNodes['inner'],
                        'target' : that.myNodes['content']
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
        that.myNodes['container'] = cm.node('div', {'class' : 'com__file-input__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.myNodes['content'] = cm.node('div', {'class' : 'com__file-input__holder'},
                    cm.node('div', {'class' : 'pt__file-line'},
                        that.myNodes['contentInner'] = cm.node('div', {'class' : 'inner'},
                            that.myNodes['clear'] = cm.node('button', {'class' : 'button button-primary'}, that.lang('remove')),
                            that.myNodes['label'] = cm.node('div', {'class' : 'label'})
                        )
                    )
                )
            )
        );
        // Render Browse Buttons
        if(that.params['local']){
            that.myNodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'class' : 'button button-primary'}, that.lang('_browse_local')),
                cm.node('div', {'class' : 'inner'},
                    that.myNodes['input'] = cm.node('input', {'type' : 'file'})
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
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['clear'], 'click', that.clearHandler);
        cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.setData = function(){
        var that = this,
            url;
        if(cm.isEmpty(that.value)){
            cm.clearNode(that.myNodes['label']);
            cm.addClass(that.myNodes['label'], 'is-hidden');
            cm.removeClass(that.myNodes['browseLocal'], 'is-hidden');
            cm.removeClass(that.myNodes['browseFileManager'], 'is-hidden');
            cm.removeClass(that.myNodes['browseFileUploader'], 'is-hidden');
            cm.addClass(that.myNodes['clear'], 'is-hidden');
        }else{
            cm.clearNode(that.myNodes['label']);
            if(that.params['showLink']){
                that.myNodes['link'] = cm.node('a', {'target' : '_blank', 'href' : that.rawValue['url'], 'title' : that.lang('open')}, that.rawValue['name']);
            }else{
                that.myNodes['link'] = cm.textNode(that.rawValue['name']);
            }
            cm.appendChild(that.myNodes['link'], that.myNodes['label']);
            cm.addClass(that.myNodes['browseLocal'], 'is-hidden');
            cm.addClass(that.myNodes['browseFileManager'], 'is-hidden');
            cm.addClass(that.myNodes['browseFileUploader'], 'is-hidden');
            cm.removeClass(that.myNodes['clear'], 'is-hidden');
            cm.removeClass(that.myNodes['label'], 'is-hidden');
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            file = e.target.files[0];
        // Read File
        that.processFiles(file);
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
            that.set(data, true);
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('file-input', {
    'node' : cm.node('input'),
    'constructor' : 'Com.FileInput'
});