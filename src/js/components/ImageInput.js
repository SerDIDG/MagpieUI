cm.define('Com.ImageInput', {
    'extend' : 'Com.FileInput',
    'params' : {
        'className' : 'com__image-input',
        'size' : 'default',
        'aspect' : false,
        'preview' : true,
        'previewConstructor' : 'Com.ImagePreviewContainer',
        'previewParams' : {},
        'langs' : {
            'preview' : 'Preview'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.FileInput.apply(that, arguments);
});

cm.getConstructor('Com.ImageInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init Preview
        if(that.params['preview']){
            cm.getConstructor(that.params['previewConstructor'], function(classObject){
                that.components['preview'] = new classObject(
                    cm.merge(that.params['previewParams'], {
                        'node' : that.nodes['content']['preview']
                    })
                );
            });
        }
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__image-input__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'},
                nodes['content'] = cm.node('div', {'class' : 'input__holder'},
                    cm.node('div', {'class' : 'input__cover'},
                        nodes['label'] = cm.node('div', {'class' : 'input__label'}),
                        nodes['buttonsInner'] = cm.node('div', {'class' : 'input__buttons'},
                            nodes['clear'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                                cm.node('button', {'type' : 'button', 'class' : 'button button-danger'},
                                    cm.node('span', that.lang('remove'))
                                )
                            )
                        )
                    ),
                    nodes['imageContainer'] = cm.node('div', {'class' : 'pt__image is-cover'},
                        cm.node('div', {'class' : 'inner'},
                            nodes['image'] = cm.node('div', {'class' : 'descr'})
                        )
                    )
                )
            )
        );
        // Image Preview size
        if(that.params['aspect']){
            cm.addClass(nodes['imageContainer'], 'is-background has-aspect');
            cm.addClass(nodes['imageContainer'], ['cm__aspect', that.params['aspect']].join('-'));
        }
        // Render Buttons
        that.renderButtons();
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['clear'], 'click', that.clearEventHandler);
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
    };

    classProto.renderButtons = function(){
        var that = this;
        if(that.params['preview']){
            that.nodes['content']['preview'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('preview'))
                )
            );
            cm.insertFirst(that.nodes['content']['preview'], that.nodes['content']['buttonsInner']);
        }
        if(that.params['local']){
            that.nodes['content']['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('_browse_local'))
                ),
                cm.node('div', {'class' : 'inner'},
                    that.nodes['content']['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            cm.addEvent(that.nodes['content']['input'], 'change', that.browseActionHandler);
            cm.insertFirst(that.nodes['content']['browseLocal'], that.nodes['content']['buttonsInner']);
        }
        if(that.params['fileManager']){
            that.nodes['content']['browseFileManager'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('_browse_filemanager'))
                )
            );
            cm.insertFirst(that.nodes['content']['browseFileManager'], that.nodes['content']['buttonsInner']);
        }
        if(that.params['fileUploader']){
            that.nodes['content']['browseFileUploader'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('browse'))
                )
            );
            cm.insertFirst(that.nodes['content']['browseFileUploader'], that.nodes['content']['buttonsInner']);
        }
        return that;
    };

    classProto.setData = function(){
        var that = this,
            url;
        if(cm.isEmpty(that.value)){
            // Preview
            that.components['preview'] && that.components['preview'].clear();
            cm.addClass(that.nodes['content']['preview'], 'is-hidden');
            that.nodes['content']['image'].style.backgroundImage = '';
            cm.addClass(that.nodes['content']['imageContainer'], 'is-default-image');
            // Label
            cm.clearNode(that.nodes['content']['label']);
            cm.addClass(that.nodes['content']['label'], 'is-hidden');
            // Remove button
            cm.addClass(that.nodes['content']['clear'], 'is-hidden');
        }else{
            // Preview
            that.components['preview'] && that.components['preview'].set(that.value);
            cm.removeClass(that.nodes['content']['preview'], 'is-hidden');
            that.nodes['content']['image'].style.backgroundImage = cm.URLToCSSURL(that.value['url']);
            cm.removeClass(that.nodes['content']['imageContainer'], 'is-default-image');
            // Label
            cm.clearNode(that.nodes['content']['label']);
            if(that.params['showLink']){
                that.nodes['content']['link'] = cm.node('a', {'target' : '_blank', 'href' : that.value['url'], 'title' : that.lang('open')}, that.value['name']);
            }else{
                that.nodes['content']['link'] = cm.textNode(that.value['name']);
            }
            cm.appendChild(that.nodes['content']['link'], that.nodes['content']['label']);
            cm.removeClass(that.nodes['content']['label'], 'is-hidden');
            // Remove button
            cm.removeClass(that.nodes['content']['clear'], 'is-hidden');
        }
        return that;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('image', {
    'node' : cm.node('input', {'type' : 'text'}),
    'constructor' : 'Com.ImageInput'
});
