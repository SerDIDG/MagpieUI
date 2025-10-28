cm.define('Com.FileInput', {
    extend: 'Com.AbstractInput',
    params: {
        controllerEvents: true,
        embedStructure: 'replace',
        hiddenType: 'textarea',

        className: 'com__file-input',
        size: 'full',                     // default, full, custom
        showLink: true,
        showFilename: true,
        showClearButton: true,
        autoOpen: false,
        placeholder: null,
        buttonsAdaptive: false,

        defaultValue: '',
        accept: [],                      // empty - accept all, example: ['image/png', 'image/jpeg']
        acceptSizes: {                   // file size, example: {min: 0, max: 0}
            min: 0,
            max: 0,
        },
        readValueType: 'base64',         // base64 | binary
        outputValueType: 'object',       // file | object

        local: true,
        fileManager: false,
        fileManagerConstructor: 'Com.AbstractFileManagerContainer',
        fileManagerParams: {
            constructorParams: {
                max: 1
            }
        },

        fileUploader: false,
        fileUploaderConstructor: 'Com.FileUploaderContainer',
        fileUploaderParams: {
            constructorParams: {
                max: 1
            }
        },

        dropzone: true,
        dropzoneConstructor: 'Com.FileDropzone',
        dropzoneParams: {
            embedStructure: 'append',
            max: 1,
            rollover: true
        },

        fileReaderConstructor: 'Com.FileReader',
        fileReaderParams: {
            readOnRender: false
        }
    },
    strings: {
        browse: 'Browse',
        browse_local: 'Browse Local',
        browse_filemanager: 'Browse File Manager',
        remove: 'Remove',
        open: 'Open',
        errors: {
            accept: 'File type is not accepted',
            sizes: 'File size does not meet requirements',
        }
    }
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.FileInput', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        var that = this;
        
        // Bind context to methods
        that.browseHandler = that.browse.bind(that);
        that.browseActionHandler = that.browseAction.bind(that);
        that.processFilesHandler = that.processFiles.bind(that);
        
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onInitComponentsStart = function() {
        var that = this;
        cm.getConstructor(that.params.fileReaderConstructor, classConstructor => {
            that.components.validator = new classConstructor(that.params.fileReaderParams);
        });
    };

    classProto.onValidateParamsEnd = function() {
        var that = this;

        // Validate Language Strings
        that.setLangs({
            _browse_local: that.params.fileManager ? that.msg('browse_local') : that.msg('browse'),
            _browse_filemanager: that.params.local ? that.msg('browse_filemanager') : that.msg('browse')
        });

        // Dropzone
        that.params.dropzone = !that.params.local ? false : that.params.dropzone;

        // File Uploader
        that.params.fileUploaderParams.openOnConstruct = that.params.autoOpen;
        that.params.fileUploaderParams.constructorParams.local = that.params.local;
        that.params.fileUploaderParams.constructorParams.fileManager = that.params.fileManager;

        // Other
        that.params.fileReaderParams.readValueType = that.params.readValueType;
        that.params.local = that.params.fileUploader ? false : that.params.local;
        that.params.fileManagerParams.openOnConstruct = that.params.autoOpen;
        that.params.fileManager = that.params.fileUploader ? false : that.params.fileManager;
    };

    classProto.onReset = function() {
        var that = this;

        // Release file object url to clear from memory
        that.releaseFileURL();
    };

    classProto.onDestruct = function() {
        var that = this;

        // Release file object url to clear from memory
        that.releaseFileURL();
    };

    /*** VIEW MODEL ***/

    classProto.renderViewModel = function() {
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init FilerReader
        cm.getConstructor(that.params.fileReaderConstructor, classConstructor => {
            that.components.reader = new classConstructor(
                cm.merge(that.params.fileReaderParams, {
                    events: {
                        onReadSuccess: (my, item) => that.set(item, true),
                    },
                })
            );
        });

        // Init Dropzone
        if (that.params.dropzone) {
            cm.getConstructor(that.params.dropzoneConstructor, classConstructor => {
                that.components.dropzone = new classConstructor(
                    cm.merge(that.params.dropzoneParams, {
                        disabled: that.params.disabled,
                        container: that.nodes.content.inner,
                        target: that.nodes.content.content,
                        events: {
                            onDrop: (my, data) => that.processFiles(data),
                        },
                    })
                );
            });
        }

        // Init File Manager
        if (that.params.fileManager) {
            cm.getConstructor(that.params.fileManagerConstructor, classConstructor => {
                that.components.fileManager = new classConstructor(
                    cm.merge(that.params.fileManagerParams, {
                        node: that.nodes.content.browseFileManager,
                        events: {
                            onComplete: (my, data) => that.processFiles(data),
                        },
                    })
                );
            });
        }
        
        // Init File Uploader
        if (that.params.fileUploader) {
            cm.getConstructor(that.params.fileUploaderConstructor, classConstructor => {
                that.components.fileUploader = new classConstructor(
                    cm.merge(that.params.fileUploaderParams, {
                        node: that.nodes.content.browseFileUploader,
                        events: {
                            onComplete: (my, data) => that.processFiles(data),
                        },
                    })
                );
            });
        }
    };

    classProto.renderContent = function() {
        var that = this,
            nodes = {};
        that.nodes.content = nodes;
        that.triggerEvent('onRenderContentStart');
        
        // Structure
        nodes.container = cm.node('div', {classes: 'com__file-input__content'},
            nodes.inner = cm.node('div', {classes: 'inner'},
                nodes.content = cm.node('div', {classes: 'com__file-input__holder'},
                    nodes.buttons = cm.node('div', {classes: 'pt__file-line'},
                        nodes.buttonsInner = cm.node('div', {classes: 'inner'},
                            nodes.label = cm.node('div', {classes: 'label'}),
                            nodes.placeholder = cm.node('div', {classes: 'label label-placeholder', innerHTML: that.params.placeholder})
                        )
                    )
                )
            )
        );

        // Render Buttons
        that.renderButtons();

        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');

        // Export
        return nodes.container;
    };

    classProto.renderLocalInput = function() {
        var that = this;
        that.nodes.content.input = cm.node('input', {classes: 'input__browse', type: 'file'});
        if (!cm.isEmpty(that.params.accept) && cm.isArray(that.params.accept)) {
            that.nodes.content.input.accept = that.params.accept.join(',');
        }
        cm.addEvent(that.nodes.content.input, 'change', that.browseActionHandler);
        cm.insertFirst(that.nodes.content.input, that.nodes.content.content);
    };

    classProto.renderButtons = function() {
        var that = this;

        // Clear button
        that.nodes.content.clear = cm.node('button', {type: 'button', classes: 'button button-primary'}, that.msg('remove'));
        cm.click.add(that.nodes.content.clear, that.clearEventHandler);
        cm.insertFirst(that.nodes.content.clear, that.nodes.content.buttonsInner);
        if (!that.params.showClearButton) {
            cm.addClass(that.nodes.content.clear, 'is-hidden');
        }

        // Local browse button
        if (that.params.local) {
            that.renderLocalInput();
            that.nodes.content.browseLocal = cm.node('button', {type: 'button', classes: 'button button-primary'}, that.msg('_browse_local'));
            cm.click.add(that.nodes.content.browseLocal, that.browseHandler);
            cm.insertFirst(that.nodes.content.browseLocal, that.nodes.content.buttonsInner);
        }

        // File manager browse button
        if (that.params.fileManager) {
            that.nodes.content.browseFileManager = cm.node('button', {type: 'button', classes: 'button button-primary'}, that.msg('_browse_filemanager'));
            cm.insertFirst(that.nodes.content.browseFileManager, that.nodes.content.buttonsInner);
        }

        // File browser browse button
        if (that.params.fileUploader) {
            that.nodes.content.browseFileUploader = cm.node('button', {type: 'button', classes: 'button button-primary'}, that.msg('browse'));
            cm.insertFirst(that.nodes.content.browseFileUploader, that.nodes.content.buttonsInner);
        }
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e) {
        var that = this,
            file = e.target.files[0];
        cm.preventDefault(e);
        
        // Read File
        that.processFiles(file);
        return that;
    };

    classProto.processFiles = function(data) {
        var that = this;
        if (cm.isFile(data)) {
            that.components.reader.read(data);
        } else if (cm.isArray(data)) {
            cm.forEach(data, function(file) {
                that.processFiles(file);
            })
        } else if (!cm.isEmpty(data)) {
            that.set(data, true);
        }
        return that;
    };

    classProto.releaseFileURL = function() {
        var that = this;
        if (!cm.isEmpty(that.value) && !cm.isEmpty(that.value.url)) {
            window.URL.revokeObjectURL(that.value.url);
        }
    };

    classProto.isAcceptableFileFormat = function(item) {
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

    classProto.isAcceptableFileSizes = function(item) {
        var that = this,
            isValid = true;
        if (
            cm.isEmpty(that.params.acceptSizes) ||
            cm.isEmpty(item) || cm.isEmpty(item.file)
        ) {
            isValid = true;
        } else {
            isValid = item.size >= that.params.acceptSizes.min && (that.params.acceptSizes.max === 0 || item.size <= that.params.acceptSizes.max);
        }
        if (that.params.formField) {
            if (!isValid) {
                that.params.formField.renderError(that.msg('errors.sizes'));
            } else {
                that.params.formField.clearError();
            }
        }
        return isValid;
    };

    /* *** DATA *** */

    classProto.get = function() {
        var that = this,
            value;
        if (that.params.outputValueType === 'file') {
            value = that.value.file || that.value.value || that.value || '';
        } else {
            value = that.value || '';
        }
        return value;
    };

    classProto.validateValue = function(value) {
        var that = this,
            item = that.components.validator.validate(value);
        if (
            (cm.isEmpty(item.value) && cm.isEmpty(item.file)) ||
            !that.isAcceptableFileFormat(item) ||
            !that.isAcceptableFileSizes(item)
        ) {
            return that.params.defaultValue;
        }
        return item;
    };

    classProto.setData = function() {
        var that = this;
        if (cm.isEmpty(that.value)) {
            if (!cm.isEmpty(that.params.placeholder)) {
                cm.removeClass(that.nodes.content.placeholder, 'is-hidden');
            } else {
                cm.addClass(that.nodes.content.placeholder, 'is-hidden');
            }
            cm.clearNode(that.nodes.content.label);
            cm.addClass(that.nodes.content.label, 'is-hidden');
            if (that.params.showClearButton) {
                cm.removeClass(that.nodes.content.browseLocal, 'is-hidden');
                cm.removeClass(that.nodes.content.browseFileManager, 'is-hidden');
                cm.removeClass(that.nodes.content.browseFileUploader, 'is-hidden');
                cm.addClass(that.nodes.content.clear, 'is-hidden');
            }
            
            // Adaptive
            if (that.params.buttonsAdaptive) {
                cm.addClass(that.nodes.content.buttons, 'is-adaptive');
            }
        } else {
            cm.addClass(that.nodes.content.placeholder, 'is-hidden');
            cm.clearNode(that.nodes.content.label);
            cm.removeClass(that.nodes.content.label, 'is-hidden');
            if (that.params.showFilename) {
                if (that.params.showLink) {
                    that.nodes.content.link = cm.node('a', {target: '_blank', href: that.value.url, title: that.msg('open')}, that.value.name);
                } else {
                    that.nodes.content.link = cm.textNode(that.value.name);
                }
                cm.appendChild(that.nodes.content.link, that.nodes.content.label);
            }
            if (that.params.showClearButton) {
                cm.addClass(that.nodes.content.browseLocal, 'is-hidden');
                cm.addClass(that.nodes.content.browseFileManager, 'is-hidden');
                cm.addClass(that.nodes.content.browseFileUploader, 'is-hidden');
                cm.removeClass(that.nodes.content.clear, 'is-hidden');
            }
            
            // Adaptive
            if (that.params.buttonsAdaptive) {
                cm.removeClass(that.nodes.content.buttons, 'is-adaptive');
            }
        }
        return that;
    };

    /* *** PUBLIC *** */

    classProto.browse = function() {
        var that = this;
        if (that.params.local) {
            that.nodes.content.input.click();
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('file', {
    node: cm.node('input', {type: 'text'}),
    value: '',
    defaultValue: '',
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.FileInput'
});
