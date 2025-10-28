cm.define('Com.ImageInput', {
    extend: 'Com.FileInput',
    params: {
        hiddenType: 'textarea',

        className: 'com__image-input',
        size: 'default',                                    // default, full, custom
        fit: 'cover',
        aspect: false,                                      // 1x1, 3x2, etc
        types: {
            image: cm._config.fileTypes.image,
            video: cm._config.fileTypes.video,
            embed: cm._config.fileTypes.embed,
        },
        showLabel: true,
        showLink: true,

        accept: [],                                         // empty - accept all, example: ['image/png', 'image/jpeg']
        acceptDimensions: {                                 // image dimensions, example: {minWidth: 0, minHeight: 0}
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
            dimensions: 'Image dimensions do not meet size requirements'
        }
    }
},
function() {
    Com.FileInput.apply(this, arguments);
});

cm.getConstructor('Com.ImageInput', function(classConstructor, className, classProto, classInherit) {
    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init Preview
        if (that.params.preview) {
            cm.getConstructor(that.params.previewConstructor, function(classConstructor) {
                that.components.preview = new classConstructor(
                    cm.merge(that.params.previewParams, {
                        node: that.nodes.content.previewButton
                    })
                );
            });
        }
    };

    classProto.renderContent = function() {
        const that = this;
        that.triggerEvent('onRenderContentStart');

        // Structure
        const nodes = {};
        that.nodes.content = nodes;

        nodes.container = cm.node('div', {classes: 'com__image-input__content'},
            nodes.inner = cm.node('div', {classes: 'inner'},
                nodes.content = cm.node('div', {classes: 'input__holder'},
                    cm.node('div', {classes: 'input__cover'},
                        nodes.label = cm.node('div', {classes: 'input__label'}),
                        nodes.buttonsInner = cm.node('div', {classes: 'input__buttons'})
                    ),
                    nodes.imageContainer = cm.node('div', {classes: 'pt__image'},
                        nodes.imageHolder = cm.node('div', {classes: 'inner'})
                    )
                )
            )
        );

        // Image Preview size
        if (that.params.aspect) {
            cm.addClass(nodes.imageContainer, 'is-background has-aspect');
            cm.addClass(nodes.imageContainer, ['cm__aspect', that.params.aspect].join('-'));
        }
        if (that.params.fit) {
            cm.addClass(nodes.imageContainer, ['is', that.params.fit].join('-'));
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
        const that = this;

        // Clear button
        that.nodes.content.clearButton = cm.node('button', {type: 'button', classes: ['button', 'button-danger', 'input__button', 'input__button--remove']},
            cm.node('span', that.msg('remove'))
        );
        cm.click.add(that.nodes.content.clearButton, that.clearEventHandler);
        cm.insertFirst(that.nodes.content.clearButton, that.nodes.content.buttonsInner);

        // Preview button
        if (that.params.preview) {
            that.nodes.content.previewButton = cm.node('button', {type: 'button', classes: ['button', 'button-primary', 'input__button', 'input__button--preview']},
                cm.node('span', that.msg('preview'))
            );
            cm.insertFirst(that.nodes.content.previewButton, that.nodes.content.buttonsInner);
        }

        // Local browse button
        if (that.params.local) {
            that.renderLocalInput();
            that.nodes.content.browseLocal = cm.node('button', {type: 'button', classes: ['button', 'button-primary', 'input__button', 'input__button--browse']},
                cm.node('span', that.msg('_browse_local'))
            );
            cm.click.add(that.nodes.content.browseLocal, that.browseHandler);
            cm.insertFirst(that.nodes.content.browseLocal, that.nodes.content.buttonsInner);
        }

        // File manager browse button
        if (that.params.fileManager) {
            that.nodes.content.browseFileManager = cm.node('button', {type: 'button', classes: ['button', 'button-primary', 'input__button', 'input__button--browse']},
                cm.node('span', that.msg('_browse_filemanager'))
            );
            cm.insertFirst(that.nodes.content.browseFileManager, that.nodes.content.buttonsInner);
        }

        // File browser browse button
        if (that.params.fileUploader) {
            that.nodes.content.browseFileUploader = cm.node('button', {type: 'button', classes: ['button', 'button-primary', 'input__button', 'input__button--browse']},
                cm.node('span', that.msg('browse'))
            );
            cm.insertFirst(that.nodes.content.browseFileUploader, that.nodes.content.buttonsInner);
        }
    };

    /******* PROCESS FILES *******/

    classProto.isAcceptableImageDimensions = function(item) {
        const that = this;

        let isValid;
        if (
            cm.isEmpty(that.params.acceptDimensions) ||
            cm.isEmpty(item) || cm.isEmpty(item.file) || !item._isLoaded ||
            !that.params.types.image.test(item.type) || item.type === 'image/svg+xml'
        ) {
            isValid = true;
        } else {
            isValid = item.width >= that.params.acceptDimensions.minWidth && item.height >= that.params.acceptDimensions.minHeight;
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

    /******* DATA *******/

    classProto.validateValue = function(value){
        const that = this;
        const item = that.components.validator.validate(value);
        if (
            (cm.isEmpty(item.value) && cm.isEmpty(item.file)) ||
            !that.isAcceptableFileFormat(item) ||
            !that.isAcceptableFileSizes(item) ||
            !that.isAcceptableImageDimensions(item)
        ) {
            return that.params.defaultValue;
        }
        return item;
    };

    classProto.setData = function() {
        const that = this;
        if (cm.isEmpty(that.value)) {
            // Label
            cm.clearNode(that.nodes.content.label);
            cm.addClass(that.nodes.content.label, 'is-hidden');

            // Hde clear button
            cm.addClass(that.nodes.content.clearButton, 'is-hidden');

            // Clear local input value
            if (that.params.local) {
                that.nodes.content.input.value = '';
            }
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
            cm.removeClass(that.nodes.content.clearButton, 'is-hidden');
        }

        // Set preview
        that.setPreviewData();
    };

    classProto.setPreviewData = function() {
        const that = this;

        // Clear
        cm.remove(that.nodes.content.image);
        cm.remove(that.nodes.content.video);

        // Set
        if (cm.isEmpty(that.value)) {
            that.components.preview && that.components.preview.clear();
            cm.addClass(that.nodes.content.previewButton, 'is-hidden');
            cm.addClass(that.nodes.content.imageContainer, 'is-default-image');

            that.renderPreviewDefault();
        } else {
            that.components.preview && that.components.preview.set(that.value);
            cm.removeClass(that.nodes.content.previewButton, 'is-hidden');
            cm.removeClass(that.nodes.content.imageContainer, 'is-default-image');

            if(that.params.types.video.test(that.value.type)) {
                that.renderPreviewVideo();
            }else{
                that.renderPreviewImage();
            }
        }
    };

    classProto.renderPreviewDefault = function() {
        const that = this;

        // Structure
        that.nodes.content.image = cm.node('div', {classes: 'descr'});

        // Append
        cm.appendChild(that.nodes.content.image, that.nodes.content.imageHolder);
    };

    classProto.renderPreviewImage = function() {
        const that = this;

        // Structure
        that.nodes.content.image = cm.node('div', {classes: 'descr'});
        that.nodes.content.image.style.backgroundImage = cm.URLToCSSURL(that.value.url);

        // Append
        cm.appendChild(that.nodes.content.image, that.nodes.content.imageHolder);
    };

    classProto.renderPreviewVideo = function() {
        const that = this;

        // Structure
        that.nodes.content.video = cm.node('video', {classes: 'descr', preload: 'none', playsinline: true, controls: false, muted: true, tabindex: -1});
        that.nodes.content.video.controls = false;
        that.nodes.content.video.playsinline = true;
        that.nodes.content.video.playsInline = true;

        // Some browsers don't display the first video frame, so we need to enable autoplay
        that.nodes.content.video.muted = true;
        that.nodes.content.video.loop = true;
        that.nodes.content.video.autoplay = true;

        // And then pause the video after it loads
        cm.addEvent(that.nodes.content.video, 'loadeddata', function(){
            that.nodes.content.video.pause();
        });
        cm.addEvent(that.nodes.content.video, 'loadedmetadata', function(){
            that.nodes.content.video.pause();
        });
        cm.addEvent(that.nodes.content.video, 'canplay', function(){
            that.nodes.content.video.pause();
        });

        // Add video source
        that.nodes.content.videoSource = cm.node('source', {src: that.value.url});
        cm.appendChild(that.nodes.content.videoSource, that.nodes.content.video);

        // Append
        cm.appendChild(that.nodes.content.video, that.nodes.content.imageHolder);
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
