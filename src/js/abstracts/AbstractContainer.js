cm.define('Com.AbstractContainer', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onOpen',
        'onClose',
        'onRenderControllerStart',
        'onRenderControllerProcess',
        'onRenderControllerEnd',
        'onRenderPlaceholderStart',
        'onRenderPlaceholderProcess',
        'onRenderPlaceholderEnd',
        'onRenderPlaceholderViewStart',
        'onRenderPlaceholderViewProcess',
        'onRenderPlaceholderViewEnd'
    ],
    'params' : {
        'embedStructure' : 'none',
        'constructor' : null,
        'params' : {},
        'placeholder' : false,
        'placeholderConstructor' : null,
        'placeholderParams' : {},
        'destructOnClose' : true,
        'langs' : {
            'title' : 'Container',
            'close' : 'Close',
            'save' : 'Save'
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractContainer', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.destructProcessHandler = that.destructProcess.bind(that);
        that.openHandler = that.open.bind(that);
        that.closeHandler = that.close.bind(that);
        that.afterOpenControllerHandler = that.afterOpenController.bind(that);
        that.afterCloseControllerHandler = that.afterCloseController.bind(that);
        that.afterOpenPlaceholderHandler = that.afterOpenPlaceholder.bind(that);
        that.afterClosePlaceholderHandler = that.afterClosePlaceholder.bind(that);
        // Add events
        that.addEvent('onDestructProcess', that.destructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.open = function(e){
        e && cm.preventDefault(e);
        var that = this;
        if(that.params['placeholder']){
            that.openPlaceholder();
        }else{
            that.openController();
        }
        return that;
    };

    classProto.close = function(e){
        e && cm.preventDefault(e);
        var that = this;
        if(that.params['placeholder']){
            that.closePlaceholder();
        }else{
            that.closeController();
        }
        return that;
    };

    classProto.getController = function(){
        var that = this;
        return that.components['controller'];
    };

    classProto.getPlaceholder = function(){
        var that = this;
        return that.components['placeholder'];
    };

    classProto.destructProcess = function(){
        var that = this;
        that.destructPlaceholder();
        that.destructController();
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParamsProcess');
        that.params['params']['node'] = that.params['node'];
        that.params['params']['container'] = that.params['container'];
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Add Event
        if(that.nodes['button']){
            cm.addEvent(that.nodes['button'], 'click', that.openHandler);
        }else{
            cm.addEvent(that.params['node'], 'click', that.openHandler);
        }
        return that;
    };

    /* *** CONTROLLER *** */

    classProto.renderController = function(){
        var that = this;
        cm.getConstructor(that.params['constructor'], function(classObject){
            that.triggerEvent('onRenderControllerStart', arguments);
            // Construct
            that.renderControllerView();
            that.components['controller'] = that.constructController(classObject);
            // Events
            that.triggerEvent('onRenderControllerProcess', that.components['controller']);
            that.renderControllerEvents();
            that.triggerEvent('onRenderControllerEnd', that.components['controller']);
        });
        return that;
    };

    classProto.renderControllerView = function(){
        var that = this;
        return that;
    };

    classProto.constructController = function(classObject){
        var that = this;
        cm.log(that.params['params']);
        return new classObject(
            cm.merge(that.params['params'], {
                'container' : that.params['placeholder'] ? that.nodes['placeholder']['content'] : that.params['container'],
                'content' : that.params['params']['content'] || that.params['content']
            })
        );
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onOpen', that.afterOpenControllerHandler);
        that.components['controller'].addEvent('onClose', that.afterCloseControllerHandler);
        return that;
    };

    classProto.destructController = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].destruct && that.components['controller'].destruct();
        return that;
    };

    classProto.openController = function(){
        var that = this;
        if(!that.components['controller'] || that.components['controller'].isDestructed){
            that.renderController();
        }
        if(that.components['controller'] && that.components['controller'].open){
            that.components['controller'].open();
        }else{
            that.afterOpenController();
        }
        return that;
    };

    classProto.closeController = function(){
        var that = this;
        if(that.components['controller'] && that.components['controller'].close){
            that.components['controller'].close();
        }else{
            that.afterCloseController();
        }
        return that;
    };

    classProto.afterOpenController = function(){
        var that = this;
        that.triggerEvent('onOpen', that.components['controller']);
        return that;
    };

    classProto.afterCloseController = function(){
        var that = this;
        if(that.params['destructOnClose']){
            that.destructController();
        }
        that.triggerEvent('onClose', that.components['controller']);
        return that;
    };

    /* *** PLACEHOLDER *** */

    classProto.renderPlaceholder = function(){
        var that = this;
        cm.getConstructor(that.params['placeholderConstructor'], function(classObject){
            that.triggerEvent('onRenderPlaceholderStart', arguments);
            // Construct
            that.renderPlaceholderView();
            that.components['placeholder'] = that.constructPlaceholder(classObject);
            that.renderPlaceholderButtons();
            // Events
            that.triggerEvent('onRenderPlaceholderProcess', that.components['placeholder']);
            that.renderPlaceholderEvents();
            that.triggerEvent('onRenderPlaceholderEnd', that.components['placeholder']);
        });
        return that;
    };

    classProto.constructPlaceholder = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['placeholderParams'], {
                'content' : that.nodes['placeholder']
            })
        );
    };

    classProto.renderPlaceholderView = function(){
        var that = this;
        that.triggerEvent('onRenderPlaceholderViewStart');
        // Structure
        that.nodes['placeholder'] = {};
        that.nodes['placeholder']['title'] = cm.textNode(that.lang('title'));
        that.nodes['placeholder']['content'] = cm.node('div', {'class' : 'com__container__content'});
        // Events
        that.triggerEvent('onRenderPlaceholderViewProcess');
        that.triggerEvent('onRenderPlaceholderViewEnd');
        return that;
    };

    classProto.renderPlaceholderButtons = function(){
        var that = this;
        that.components['placeholder'].addButton({
            'name' : 'close',
            'label' : that.lang('close'),
            'style' : 'button-primary',
            'callback' : that.closeHandler
        });
        return that;
    };

    classProto.renderPlaceholderEvents = function(){
        var that = this;
        that.components['placeholder'].addEvent('onOpen', that.afterOpenPlaceholderHandler);
        that.components['placeholder'].addEvent('onClose', that.afterClosePlaceholderHandler);
        return that;
    };

    classProto.destructPlaceholder = function(){
        var that = this;
        that.components['placeholder'] && that.components['placeholder'].destruct && that.components['placeholder'].destruct();
        return that;
    };

    classProto.openPlaceholder = function(){
        var that = this;
        if(!that.components['placeholder'] || that.components['placeholder'].isDestructed){
            that.renderPlaceholder();
        }
        if(that.components['placeholder'] && that.components['placeholder'].open){
            that.components['placeholder'].open();
        }else{
            that.afterOpenPlaceholder();
        }
        return that;
    };

    classProto.closePlaceholder = function(){
        var that = this;
        if(that.components['placeholder'] && that.components['placeholder'].close){
            that.components['placeholder'].close();
        }else{
            that.afterClosePlaceholder();
        }
        return that;
    };

    classProto.afterOpenPlaceholder = function(){
        var that = this;
        that.openController();
        that.constructCollector();
        that.triggerEvent('onOpen', that.components['placeholder']);
        return that;
    };

    classProto.afterClosePlaceholder = function(){
        var that = this;
        that.closeController();
        if(that.params['destructOnClose']){
            that.destructPlaceholder();
            that.destructCollector();
        }
        that.triggerEvent('onClose', that.components['placeholder']);
        return that;
    };
});