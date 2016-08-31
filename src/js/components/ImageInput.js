cm.define('Com.ImageInput', {
    'extend' : 'Com.FileInput',
    'params' : {
        'className' : 'com__image-input',
        'size' : 'default',
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
                        'node' : that.myNodes['preview']
                    })
                );
            });
        }
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__image-input__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.myNodes['content'] = cm.node('div', {'class' : 'input__holder'},
                    cm.node('div', {'class' : 'input__cover'},
                        that.myNodes['label'] = cm.node('div', {'class' : 'input__label'}),
                        that.myNodes['buttonsInner'] = cm.node('div', {'class' : 'input__buttons'},
                            that.myNodes['clear'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                                cm.node('button', {'type' : 'button', 'class' : 'button button-danger'},
                                    cm.node('span', that.lang('remove'))
                                )
                            )
                        )
                    ),
                    that.myNodes['imageContainer'] = cm.node('div', {'class' : 'pt__image is-cover'},
                        cm.node('div', {'class' : 'inner'},
                            that.myNodes['image'] = cm.node('div', {'class' : 'descr'})
                        )
                    )
                )
            )
        );
        // Render Buttons
        if(that.params['preview']){
            that.myNodes['preview'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('preview'))
                )
            );
            cm.insertFirst(that.myNodes['preview'], that.myNodes['buttonsInner']);
        }
        if(that.params['local']){
            that.myNodes['browseLocal'] = cm.node('div', {'class' : 'browse-button'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('_browse_local'))
                ),
                cm.node('div', {'class' : 'inner'},
                    that.myNodes['input'] = cm.node('input', {'type' : 'file'})
                )
            );
            cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
            cm.insertFirst(that.myNodes['browseLocal'], that.myNodes['buttonsInner']);
        }
        if(that.params['fileManager']){
            that.myNodes['browseFileManager'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('_browse_filemanager'))
                )
            );
            cm.insertFirst(that.myNodes['browseFileManager'], that.myNodes['buttonsInner']);
        }
        if(that.params['fileUploader']){
            that.myNodes['browseFileUploader'] = cm.node('div', {'class' : 'cm__button-wrapper'},
                cm.node('button', {'type' : 'button', 'class' : 'button button-primary'},
                    cm.node('span', that.lang('browse'))
                )
            );
            cm.insertFirst(that.myNodes['browseFileUploader'], that.myNodes['buttonsInner']);
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['clear'], 'click', that.clearEventHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.setData = function(){
        var that = this,
            url;
        if(cm.isEmpty(that.value)){
            // Preview
            that.components['preview'] && that.components['preview'].clear();
            cm.addClass(that.myNodes['preview'], 'is-hidden');
            that.myNodes['image'].style.backgroundImage = '';
            cm.addClass(that.myNodes['imageContainer'], 'is-default-image');
            // Label
            cm.clearNode(that.myNodes['label']);
            cm.addClass(that.myNodes['label'], 'is-hidden');
            // Remove button
            cm.addClass(that.myNodes['clear'], 'is-hidden');
        }else{
            // Preview
            that.components['preview'] && that.components['preview'].set(that.value);
            cm.removeClass(that.myNodes['preview'], 'is-hidden');
            that.myNodes['image'].style.backgroundImage = cm.URLToCSSURL(that.value['url']);
            cm.removeClass(that.myNodes['imageContainer'], 'is-default-image');
            // Label
            cm.clearNode(that.myNodes['label']);
            if(that.params['showLink']){
                that.myNodes['link'] = cm.node('a', {'target' : '_blank', 'href' : that.value['url'], 'title' : that.lang('open')}, that.value['name']);
            }else{
                that.myNodes['link'] = cm.textNode(that.value['name']);
            }
            cm.appendChild(that.myNodes['link'], that.myNodes['label']);
            cm.removeClass(that.myNodes['label'], 'is-hidden');
            // Remove button
            cm.removeClass(that.myNodes['clear'], 'is-hidden');
        }
        return that;
    };
});
