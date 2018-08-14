cm.define('Com.FileDropzone', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onDrop',
        'onSelect'
    ],
    'params' : {
        'embedStructure' : 'append',
        'target' : null,
        'rollover' : true,
        'max' : 0,                                  // 0 - infinity
        '_height' : 128,
        '_duration' : 'cm._config.animDuration',
        'Com.FileReader' : {}
    },
    'strings' : {
        'drop_single' : 'drop file here',
        'drop_multiple' : 'drop files here'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileDropzone', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        that.dragInterval = null;
        that.isShow = true;
        that.isHighlighted = false;
        // Bind context to methods
        that.dragOverHandler = that.dragOver.bind(that);
        that.dragDropHandler = that.dragDrop.bind(that);
        that.showDropzoneHandler = that.showDropzone.bind(that);
        that.hideDropzoneHandler = that.hideDropzone.bind(that);
        that.onGetLESSVariablesProcessHandler = that.onGetLESSVariablesProcess.bind(that);
        that.setEventsProcessHander = that.setEventsProcess.bind(that);
        that.unsetEventsProcessHander = that.unsetEventsProcess.bind(that);
        // Add events
        that.addEvent('onGetLESSVariablesProcess', that.onGetLESSVariablesProcessHandler);
        that.addEvent('onSetEventsProcess', that.setEventsProcessHander);
        that.addEvent('onUnsetEventsProcess', that.unsetEventsProcessHander);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            'drop' : !that.params['max'] || that.params['max'] > 1 ? that.lang('drop_multiple') : that.lang('drop_single')
        });
    };

    classProto.onGetLESSVariablesProcess = function(){
        var that = this;
        if(!that.params['height']){
            that.params['height'] = cm.getLESSVariable('ComFileDropzone-Height', that.params['_height'], true);
        }
        if(!that.params['duration']){
            that.params['duration'] = cm.getTransitionDurationFromLESS('ComFileDropzone-Duration', that.params['_duration']);
        }
    };

    classProto.setEventsProcess = function(){
        var that = this;
        cm.addEvent(window, 'dragover', that.dragOverHandler);
        cm.addEvent(window, 'drop', that.dragDropHandler);
    };

    classProto.unsetEventsProcess = function(){
        var that = this;
        cm.removeEvent(window, 'dragover', that.dragOverHandler);
        cm.removeEvent(window, 'drop', that.dragDropHandler);
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
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init container animation
        if(that.params['rollover']){
            cm.addClass(that.nodes['container'], 'is-hidden');
            that.components['animation'] = new cm.Animation(that.params['container']);
        }else{
            cm.removeClass(that.nodes['container'], 'is-hidden');
            if(that.params['height']){
                that.params['container'].style.height = that.params['height'] + 'px';
            }
        }
    };

    /* *** DROPZONE *** */

    classProto.dragOver = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        cm.preventDefault(e);
        // Show dropzone
        that.show();
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
    };

    classProto.dragDrop = function(e){
        var that = this,
            target = cm.getEventTarget(e);
        if(cm.isParent(that.nodes['container'], target, true)){
            cm.stopPropagation(e);
            cm.preventDefault(e);
            // Get files
            if(e.dataTransfer){
                if(e.dataTransfer.files && e.dataTransfer.files.length){
                    // Dropped files from local
                    that.processFiles(e.dataTransfer.files);
                }else{
                    // Dropped files from another browser window
                    cm.fileFromDataTransfer(e, function(file){
                        that.processFiles([file]);
                    });
                }
            }
        }
        // Hide dropzone and reset his state
        that.dragInterval && clearTimeout(that.dragInterval);
        that.hide();
        that.hideDropzone();
    };
    
    classProto.processFiles = function(files){
        var that = this,
            data = [],
            length = that.params['max'] ? Math.min(files.length, that.params['max']) : files.length;;
        // Process file
        cm.forEach(length, function(i){
            data.push(files[i]);
            that.triggerEvent('onDrop', files[i]);
        });
        if(data.length){
            that.triggerEvent('onSelect', data);
        }
    };

    classProto.show = function(){
        var that = this;
        if(!that.isShow){
            that.isShow = true;
            cm.replaceClass(that.nodes['container'], 'is-hidden', 'is-show');
        }
    };

    classProto.hide = function(){
        var that = this;
        if(that.isShow){
            that.isShow = false;
            cm.replaceClass(that.nodes['container'], 'is-show', 'is-hidden');
        }
    };

    classProto.showDropzone = function(){
        var that = this,
            height;
        if(!that.isHighlighted){
            that.isHighlighted = true;
            // Set classes
            cm.addClass(that.nodes['container'], 'is-highlight');
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
    };

    classProto.hideDropzone = function(){
        var that = this,
            height;
        if(that.isHighlighted){
            that.isHighlighted = false;
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
    };
});