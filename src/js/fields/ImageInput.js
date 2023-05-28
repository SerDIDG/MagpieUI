cm.define('Com.ImageInput', {
    extend: 'Com.FileInput',
    params: {
        hiddenType: 'textarea',

        className: 'com__image-input',
        size: 'default',                                    // default, full, custom
        aspect: false,                                      // 1x1, 3x2, etc
        types: {
            image: /image\/.*/,
            video: /video\/(mp4|webm|ogg|avi)/,
            embed: /application\/pdf/
        },
        showLabel: true,
        showLink: true,

        accept: [],                                         // empty - accept all, example: ['image/png', 'image/jpeg']
        dimensions: {                                       // image dimensions, example: {minWidth: 0, minHeight: 0}
            minWidth: 0,
            minHeight: 0,
        },

        preview: true,
        previewConstructor: 'Com.ImagePreviewContainer',
        previewParams: {}
    },
    strings: {
        preview: 'Preview',
        errors: {
            dimensions: 'Image dimensions do not meet requirements'
        }
    }
},
function() {
    Com.FileInput.apply(this, arguments);
});

cm.getConstructor('Com.ImageInput', function(classConstructor, className, classProto, classInherit) {
    classProto.renderViewModel = function() {
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init Preview
        if (that.params.preview) {
            cm.getConstructor(that.params.previewConstructor, function(classObject) {
                that.components.preview = new classObject(
                    cm.merge(that.params.previewParams, {
                        node: that.nodes.content.preview
                    })
                );
            });
        }
    };

    classProto.renderContent = function() {
        var that = this;
        that.triggerEvent('onRenderContentStart');

        // Structure
        var nodes = {};
        that.nodes.content = nodes;
        nodes.container = cm.node('div', {classes: 'com__image-input__content'},
            nodes.inner = cm.node('div', {classes: 'inner'},
                nodes.content = cm.node('div', {classes: 'input__holder'},
                    cm.node('div', {classes: 'input__cover'},
                        nodes.label = cm.node('div', {classes: 'input__label'}),
                        nodes.buttonsInner = cm.node('div', {classes: 'input__buttons'})
                    ),
                    nodes.imageContainer = cm.node('div', {classes: 'pt__image is-cover'},
                        cm.node('div', {classes: 'inner'},
                            nodes.image = cm.node('div', {classes: 'descr'})
                        )
                    )
                )
            )
        );

        // Image Preview size
        if (that.params.aspect) {
            cm.addClass(nodes.imageContainer, 'is-background has-aspect');
            cm.addClass(nodes.imageContainer, ['cm__aspect', that.params.aspect].join('-'));
        }

        // Render Buttons
        that.renderButtons();

        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');

        // Export
        return nodes.container;
    };

    classProto.renderButtons = function() {
        var that = this;

        that.nodes.content.clear = cm.node('div', {classes: 'cm__button-wrapper input__button--remove'},
            cm.node('button', {type: 'button', classes: 'button button-danger'},
                cm.node('span', that.msg('remove'))
            )
        )
        cm.addEvent(that.nodes.content.clear, 'click', that.clearEventHandler);
        cm.insertFirst(that.nodes.content.clear, that.nodes.content.buttonsInner);
        
        if (that.params.preview) {
            that.nodes.content.preview = cm.node('div', {classes: 'cm__button-wrapper input__button--preview'},
                cm.node('button', {type: 'button', classes: 'button button-primary'},
                    cm.node('span', that.msg('preview'))
                )
            );
            cm.insertFirst(that.nodes.content.preview, that.nodes.content.buttonsInner);
        }
        
        if (that.params.local) {
            that.nodes.content.browseLocal = cm.node('div', {classes: 'browse-button input__button--browse'},
                cm.node('button', {type: 'button', classes: 'button button-primary'},
                    cm.node('span', that.msg('_browse_local'))
                ),
                cm.node('div', {classes: 'inner'},
                    that.nodes.content.input = cm.node('input', {type: 'file'})
                )
            );
            if(!cm.isEmpty(that.params.accept) && cm.isArray(that.params.accept)){
                that.nodes.content.input.accept = that.params.accept.join(',');
            }
            cm.addEvent(that.nodes.content.input, 'change', that.browseActionHandler);
            cm.insertFirst(that.nodes.content.browseLocal, that.nodes.content.buttonsInner);
        }
        
        if (that.params.fileManager) {
            that.nodes.content.browseFileManager = cm.node('div', {classes: 'cm__button-wrapper input__button--browse'},
                cm.node('button', {type: 'button', classes: 'button button-primary'},
                    cm.node('span', that.msg('_browse_filemanager'))
                )
            );
            cm.insertFirst(that.nodes.content.browseFileManager, that.nodes.content.buttonsInner);
        }
        
        if (that.params.fileUploader) {
            that.nodes.content.browseFileUploader = cm.node('div', {classes: 'cm__button-wrapper input__button--browse'},
                cm.node('button', {type: 'button', classes: 'button button-primary'},
                    cm.node('span', that.msg('browse'))
                )
            );
            cm.insertFirst(that.nodes.content.browseFileUploader, that.nodes.content.buttonsInner);
        }
    };

    /* *** PROCESS FILES *** */

    classProto.isAcceptableImageDimensions = function(item) {
        var that = this,
            isValid = true;
        if (
            cm.isEmpty(that.params.dimensions)
            || cm.isEmpty(item) || cm.isEmpty(item.file) || !item._isLoaded
            || !that.params.types.image.test(item.type) || item.type === 'image/svg+xml'
        ) {
            isValid = true;
        } else {
            isValid = item.width >= that.params.dimensions.minWidth && item.height >= that.params.dimensions.minHeight;
        }
        if (that.params.formField) {
            if (!isValid) {
                that.params.formField.renderError(that.msg('errors.dimensions'));
            } else {
                that.params.formField.clearError();
            }
        }
        return isValid;
    };

    /* *** DATA *** */

    classProto.validateValue = function(value){
        var that = this,
            item = that.components.validator.validate(value);
        if (
            (cm.isEmpty(item.value) && cm.isEmpty(item.file))
            || !that.isAcceptableFileFormat(item)
            || !that.isAcceptableImageDimensions(item)
        ) {
            return that.params.defaultValue;
        }
        return item;
    };

    classProto.setData = function() {
        var that = this;
        if (cm.isEmpty(that.value)) {
            // Label
            cm.clearNode(that.nodes.content.label);
            cm.addClass(that.nodes.content.label, 'is-hidden');
            // Hde clear button
            cm.addClass(that.nodes.content.clear, 'is-hidden');
        } else {
            // Label
            cm.clearNode(that.nodes.content.label);
            if (that.params.showLabel) {
                if (that.params.showLink) {
                    that.nodes.content.link = cm.node('a', {target: '_blank', href: that.value.url, title: that.msg('open')}, that.value.name);
                } else {
                    that.nodes.content.link = cm.textNode(that.value.name);
                }
                cm.appendChild(that.nodes.content.link, that.nodes.content.label);
                cm.removeClass(that.nodes.content.label, 'is-hidden');
            }
            // Show clear button
            cm.removeClass(that.nodes.content.clear, 'is-hidden');
        }

        // Set preview
        that.setPreviewData();
    };

    classProto.setPreviewData = function() {
        var that = this;

        // Clear
        that.nodes.content.image.style.backgroundImage = '';
        cm.remove(that.nodes.content.iframe);
        cm.remove(that.nodes.content.video);

        // Set
        if (cm.isEmpty(that.value)) {
            that.components.preview && that.components.preview.clear();
            cm.addClass(that.nodes.content.preview, 'is-hidden');
            cm.addClass(that.nodes.content.imageContainer, 'is-default-image');
        } else {
            that.components.preview && that.components.preview.set(that.value);
            if(that.params.types.video.test(that.value.type)) {
                that.nodes.content.video = cm.node('video',
                    cm.node('source', {'src': that.value.url})
                );
                that.nodes.content.video.muted = true;
                that.nodes.content.video.autoplay = false;
                that.nodes.content.video.loop = true;
                cm.appendChild(that.nodes.content.video, that.nodes.content.image);
            /*
            }else if(that.params.types.embed.test(that.value.type)) {
                that.nodes.content.iframe = cm.node('iframe', {'src' : that.value.url});
                cm.appendChild(that.nodes.content.iframe, that.nodes.content.image);
            */
            }else{
                that.nodes.content.image.style.backgroundImage = cm.URLToCSSURL(that.value.url);
            }
            cm.removeClass(that.nodes.content.preview, 'is-hidden');
            cm.removeClass(that.nodes.content.imageContainer, 'is-default-image');
        }
    };
});

/****** FORM FIELD COMPONENT *******/

Com.FormFields.add('image', {
    node: cm.node('input', {type: 'text'}),
    value: '',
    defaultValue: '',
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.ImageInput'
});
