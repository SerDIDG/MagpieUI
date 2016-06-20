cm.define('Com.FileDropzone', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onDrop'
    ],
    'params' : {
        'embedStructure' : 'append',
        'target' : null,
        'height' : 128,
        'animated' : true,
        'rollover' : true,
        'max' : 0,                                  // 0 - infinity
        'duration' : 'cm._config.animDuration',
        'langs' : {
            'drop_single' : 'drop file here',
            'drop_multiple' : 'drop files here'
        },
        'Com.FileReader' : {}
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.dragInterval = null;
    that.isDropzoneShow = false;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileDropzone', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.dragOverHandler = that.dragOver.bind(that);
        that.dragDropHandler = that.dragDrop.bind(that);
        that.showDropzoneHandler = that.showDropzone.bind(that);
        that.hideDropzoneHandler = that.hideDropzone.bind(that);
        that.getLESSVariablesEndHandler = that.getLESSVariablesEnd.bind(that);
        that.setEventsProcessHander = that.setEventsProcess.bind(that);
        that.unsetEventsProcessHander = that.unsetEventsProcess.bind(that);
        // Add events
        that.addEvent('onGetLESSVariablesEnd', that.getLESSVariablesEndHandler);
        that.addEvent('onSetEventsProcess', that.setEventsProcessHander);
        that.addEvent('onUnsetEventsProcess', that.unsetEventsProcessHander);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            'drop' : !that.params['max'] || that.params['max'] > 1 ? that.lang('drop_multiple') : that.lang('drop_single')
        });
        return that;
    };

    classProto.getLESSVariablesEnd = function(){
        var that = this;
        that.params['height'] = cm.getLESSVariable('ComFileDropzone-Height', that.params['height'], true);
        that.params['duration'] = cm.getTransitionDurationFromLESS('ComFileDropzone-Duration', that.params['duration']);
        return that;
    };

    classProto.setEventsProcess = function(){
        var that = this;
        cm.addEvent(window, 'dragover', that.dragOverHandler);
        cm.addEvent(window, 'drop', that.dragDropHandler);
        return that;
    };

    classProto.unsetEventsProcess = function(){
        var that = this;
        cm.removeEvent(window, 'dragover', that.dragOverHandler);
        cm.removeEvent(window, 'drop', that.dragDropHandler);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-dropzone'},
            cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'title'},
                    cm.node('div', {'class' : 'label'}, that.lang('drop')),
                    cm.node('div', {'class' : 'icon cm-i cm-i__circle-arrow-down'})
                )
            )
        );
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init container animation
        if(that.params['rollover']){
            cm.addClass(that.nodes['container'], 'is-hidden');
            that.components['animation'] = new cm.Animation(that.params['container']);
        }else{
            cm.removeClass(that.nodes['container'], 'is-hidden');
            that.params['container'].style.height = that.params['height'] + 'px';
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.processFile = function(file){
        var that = this;
        that.components['reader'].read(file);
        return that;
    };

    /* *** DROPZONE *** */

    classProto.dragOver = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        cm.preventDefault(e);
        // Show dropzone
        that.showDropzone();
        // Hide dropzone if event not triggering inside the current document window (hax)
        that.dragInterval && clearTimeout(that.dragInterval);
        that.dragInterval = setTimeout(that.hideDropzoneHandler, 100);
        // Highlight dropzone
        if(cm.isParent(that.nodes['container'], target, true)){
            cm.addClass(that.nodes['container'], 'is-highlight');
        }else{
            cm.removeClass(that.nodes['container'], 'is-highlight');
        }
        return that;
    };

    classProto.dragDrop = function(e){
        var that = this,
            target = cm.getEventTarget(e),
            length = 0;
        cm.preventDefault(e);
        // Hide dropzone and reset his state
        that.dragInterval && clearTimeout(that.dragInterval);
        that.hideDropzone();
        // Process file
        if(cm.isParent(that.nodes['container'], target, true)){
            if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length){
                length = that.params['max'] ? Math.min(e.dataTransfer.files.length, that.params['max']) : e.dataTransfer.files.length;
                cm.forEach(length, function(i){
                    that.triggerEvent('onDrop', e.dataTransfer.files[i]);
                });
            }
        }
        return that;
    };

    classProto.showDropzone = function(){
        var that = this,
            height;
        if(!that.isDropzoneShow){
            that.isDropzoneShow = true;
            // Set classes
            cm.removeClass(that.nodes['container'], 'is-highlight');
            // Animate
            if(that.params['rollover']){
                // Set classes
                cm.addClass(that.params['container'], 'is-dragging');
                cm.addClass(that.params['target'], 'is-hidden');
                cm.removeClass(that.nodes['container'], 'is-hidden');
                // Animate
                height = Math.max(that.params['height'], that.params['target'].offsetHeight);
                that.components['animation'].go({
                    'style' : {'height' : (height + 'px')},
                    'duration' : that.params['duration'],
                    'anim' : 'smooth'
                });
            }
        }
        return that;
    };

    classProto.hideDropzone = function(){
        var that = this,
            height;
        if(that.isDropzoneShow){
            that.isDropzoneShow = false;
            // Set classes
            cm.removeClass(that.nodes['container'], 'is-highlight');
            // Animate
            if(that.params['rollover']){
                // Set classes
                cm.removeClass(that.params['container'], 'is-dragging');
                cm.removeClass(that.params['target'], 'is-hidden');
                cm.addClass(that.nodes['container'], 'is-hidden');
                // Animate
                height = that.params['target'].offsetHeight;
                that.components['animation'].go({
                    'style' : {'height' : (height + 'px')},
                    'duration' : that.params['duration'],
                    'anim' : 'smooth',
                    'onStop' : function(){
                        that.params['container'].style.height = 'auto';
                    }
                });
            }
        }
        return that;
    };
});