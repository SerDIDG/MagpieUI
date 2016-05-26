cm.define('Com.FileInput', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__file-input',
        'type' : 'file',                     // file | image
        'label' : '',
        'langs' : {
            'browse' : 'Browse',
            'remove' : 'Remove',
            'drop_here' : 'drop files here'
        }
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.myComponents = {};
    that.dragInterval = null;
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.FileInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.browseActionHandler = that.browseAction.bind(that);
        that.readerActionHandler = that.readerAction.bind(that);
        that.dragOverHandler = that.dragOver.bind(that);
        that.dragDropHandler = that.dragDrop.bind(that);
        that.resetDropzoneHandler = that.resetDropzone.bind(that);
        // Add events
        that.addEvent('onSetEvents', function(){
            cm.addEvent(window, 'dragover', that.dragOverHandler);
            cm.addEvent(window, 'drop', that.dragDropHandler);
        });
        that.addEvent('onUnsetEvents', function(){
            cm.removeEvent(window, 'dragover', that.dragOverHandler);
            cm.removeEvent(window, 'drop', that.dragDropHandler);
        });
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        cm.addClass(that.myNodes['remove'], 'is-hidden');
        cm.removeClass(that.myNodes['browse'], 'is-hidden');
        // Call parent method
        _inherit.prototype.clear.apply(that, arguments);
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Init File Reader API
        that.myComponents['reader'] = new FileReader();
        cm.addEvent(that.myComponents['reader'], 'load', that.readerActionHandler);
        // Call parent method
        _inherit.prototype.render.apply(that, arguments);
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__file-input__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.myNodes['contentHolder'] = cm.node('div', {'class' : 'com__file-input__holder'},
                    cm.node('div', {'class' : 'pt__file-line'},
                        that.myNodes['remove'] = cm.node('button', {'class' : 'button button-primary'}, that.lang('remove')),
                        that.myNodes['browse'] = cm.node('div', {'class' : 'browse-button'},
                            cm.node('button', {'class' : 'button button-primary'}, that.lang('browse')),
                            cm.node('div', {'class' : 'inner'},
                                that.myNodes['input'] = cm.node('input', {'type' : 'file', 'multiple' : false})
                            )
                        ),
                        that.myNodes['label'] = cm.node('div', {'class' : 'label'})
                    )
                ),
                that.myNodes['dropzoneHolder'] = cm.node('div', {'class' : 'com__file-input__drop is-hidden'},
                    that.myNodes['dropzone'] = cm.node('div', {'class' : 'pt__file-drop'},
                        cm.node('div', {'class' : 'inner'},
                            cm.node('div', {'class' : 'title'},
                                cm.node('div', {'class' : 'label'}, that.lang('drop_here')),
                                cm.node('div', {'class' : 'icon cm-i cm-i__circle-arrow-down'})
                            )
                        )
                    )
                )
            )
        );
        // Events
        that.triggerEvent('onRenderContent');
        cm.addEvent(that.myNodes['remove'], 'click', that.clearHandler);
        cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.browseAction = function(e){
        var that = this,
            file = e.target.files[0];
        that.processFile(file);
        return that;
    };

    classProto.processFile = function(file){
        var that = this;
        that.myComponents['reader'] && that.myComponents['reader'].readAsDataURL(file);
        return that;
    };

    classProto.readerAction = function(e){
        var that = this,
            result = e.target.result;
        cm.log(result);
        return that;
    };

    /* *** DRAG AND DROP ACTIONS *** */

    classProto.dragOver = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        cm.preventDefault(e);
        // Show dropzone
        cm.addClass(that.myNodes['container'], 'is-dragging');
        cm.addClass(that.myNodes['contentHolder'], 'is-hidden');
        cm.removeClass(that.myNodes['dropzoneHolder'], 'is-hidden');
        // Hide dropzone if event not triggering inside the current document window (hax)
        that.dragInterval && clearTimeout(that.dragInterval);
        that.dragInterval = setTimeout(that.resetDropzoneHandler, 100);
        // Highlight dropzone
        if(cm.isParent(that.myNodes['container'], target, true)){
            cm.addClass(that.myNodes['dropzone'], 'is-highlight');
        }else{
            cm.removeClass(that.myNodes['dropzone'], 'is-highlight');
        }
        return that;
    };

    classProto.dragDrop = function(e){
        var that = this,
            target = cm.getEventTarget(e),
            file;
        cm.preventDefault(e);
        // Hide dropzone and reset his state
        that.dragInterval && clearTimeout(that.dragInterval);
        that.resetDropzone();
        // Process file
        if(cm.isParent(that.myNodes['container'], target, true)){
            if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){
                file = e.dataTransfer.files[0];
                that.processFile(file);
            }
        }
        return that;
    };

    classProto.resetDropzone = function(){
        var that = this;
        cm.removeClass(that.myNodes['container'], 'is-dragging');
        cm.removeClass(that.myNodes['contentHolder'], 'is-hidden');
        cm.addClass(that.myNodes['dropzoneHolder'], 'is-hidden');
        cm.removeClass(that.myNodes['dropzone'], 'is-highlight');
        return that;
    };
});