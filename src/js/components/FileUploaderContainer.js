cm.define('Com.FileUploaderContainer', {
    'extend' : 'Com.AbstractContainer',
    'events' : [
        'onComplete',
        'onGet'
    ],
    'params' : {
        'constructor' : 'Com.FileUploader',
        'placeholder' : true,
        'placeholderConstructor' : 'Com.DialogContainer',
        'placeholderParams' : {
            'params' : {
                'width' : 900
            }
        },
        'langs' : {
            'title_single' : 'Please select file',
            'title_multiple' : 'Please select files',
            'close' : 'Cancel',
            'save' : 'Select'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractContainer.apply(that, arguments);
});

cm.getConstructor('Com.FileUploaderContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.renderControllerProcessHandler = that.renderControllerProcess.bind(that);
        that.getHandler = that.get.bind(that);
        that.completeHandler = that.complete.bind(that);
        that.afterCompleteHandler = that.afterComplete.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        that.addEvent('onRenderControllerProcess', that.renderControllerProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.get = function(e){
        e && cm.preventDefault(e);
        var that = this;
        that.components['controller'] && that.components['controller'].get && that.components['controller'].get();
        return that;
    };

    classProto.complete = function(e){
        e && cm.preventDefault(e);
        var that = this;
        that.components['controller'] && that.components['controller'].complete && that.components['controller'].complete();
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        // Validate Language Strings
        that.setLangs({
            'title' : !that.params['params']['max'] || that.params['params']['max'] > 1 ? that.lang('title_multiple') : that.lang('title_single')
        });
    };

    classProto.renderControllerProcess = function(){
        var that = this;
        that.components['controller'].addEvent('onGet', function(my, data){
            that.afterGet(data);
        });
        that.components['controller'].addEvent('onComplete', function(my, data){
            that.afterComplete(data);
        });
        return that;
    };

    classProto.renderPlaceholderViewButtons = function(){
        var that = this;
        // Structure
        that.nodes['placeholder']['buttons'] = cm.node('div', {'class' : 'pt__buttons pull-right'},
            that.nodes['placeholder']['buttonsInner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['placeholder']['close'] = cm.node('button', {'class' : 'button button-transparent'}, that.lang('close')),
                that.nodes['placeholder']['save'] = cm.node('button', {'class' : 'button button-primary'}, that.lang('save'))
            )
        );
        // Events
        cm.addEvent(that.nodes['placeholder']['close'], 'click', that.closeHandler);
        cm.addEvent(that.nodes['placeholder']['save'], 'click', that.completeHandler);
        return that;
    };

    /* *** AFTER EVENTS *** */

    classProto.afterGet = function(data){
        var that = this;
        that.triggerEvent('onGet', data);
        return that;
    };

    classProto.afterComplete = function(data){
        var that = this;
        that.triggerEvent('onComplete', data);
        that.close();
        return that;
    };
});