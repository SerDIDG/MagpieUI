cm.define('Com.AbstractContainer', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onOpen',
        'onOpenEnd',
        'onClose',
        'onOpenPlaceholder',
        'onOpenPlaceholderEnd',
        'onClosePlaceholder',
        'onRenderControllerStart',
        'onRenderControllerProcess',
        'onRenderController',
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
        'controllerEvents' : true,
        'constructor' : null,
        'constructorParams' : {},
        'params' : {},                      // ToDo: deprecated, use constructorParams
        'placeholder' : false,
        'placeholderConstructor' : null,
        'placeholderParams' : {},
        'destructOnClose' : true,
        'openOnConstruct' : false
    },
    'strings' : {
        'title' : 'Container',
        'close' : 'Close',
        'save' : 'Save',
        'help' : ''
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractContainer', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        // Variables
        that.isOpen = false;
        that.targetNode = null;
        // Bind context to methods
        that.openHandler = that.open.bind(that);
        that.closeHandler = that.close.bind(that);
        that.afterOpenControllerHandler = that.afterOpenController.bind(that);
        that.afterOpenControllerEndHandler = that.afterOpenControllerEnd.bind(that);
        that.afterCloseControllerHandler = that.afterCloseController.bind(that);
        that.afterOpenPlaceholderHandler = that.afterOpenPlaceholder.bind(that);
        that.afterOpenPlaceholderEndHandler = that.afterOpenPlaceholderEnd.bind(that);
        that.afterClosePlaceholderHandler = that.afterClosePlaceholder.bind(that);
        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.onDestructProcess = function(){
        var that = this;
        that.destructPlaceholder();
        that.destructController();
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        that.params['params']['node'] = that.params['node'];
        that.params['params']['container'] = that.params['container'];
        that.triggerEvent('onValidateParamsEnd');
        // TODO: replace that.params['params'] to that.params['constructorParams']
        that.params['params'] = cm.merge(that.params['constructorParams'], that.params['params']);
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

    classProto.render = function(){
        var that = this;
        // Add Event
        if(that.nodes['button']){
            that.setTarget(that.nodes['button']);
        }else{
            that.setTarget(that.params['node']);
        }
        // Open on construct
        that.params['openOnConstruct'] && that.open();
    };

    classProto.setTarget = function(node){
        var that = this;
        if(that.targetNode){
            cm.click.remove(that.targetNode, that.openHandler);
            that.targetNode = null;
        }
        if(cm.isNode(node)){
            that.targetNode = node;
            cm.click.add(node, that.openHandler);
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
            that.triggerEvent('onRenderController', that.components['controller']);
            that.triggerEvent('onRenderControllerEnd', that.components['controller']);
        });
    };

    classProto.renderControllerView = function(){
        var that = this;
    };

    classProto.constructController = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['params'], {
                'opener' : that,
                'container' : that.params['placeholder'] ? that.nodes['placeholder']['content'] : that.params['container'],
                'content' : that.params['params']['content'] || that.params['content']
            })
        );
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onOpen', that.afterOpenControllerHandler);
        that.components['controller'].addEvent('onOpenEnd', that.afterOpenControllerEndHandler);
        that.components['controller'].addEvent('onClose', that.afterCloseControllerHandler);
    };

    classProto.destructController = function(){
        var that = this;
        that.components['controller'] && that.components['controller'].destruct && that.components['controller'].destruct();
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
    };

    classProto.closeController = function(){
        var that = this;
        if(that.components['controller'] && that.components['controller'].close){
            that.components['controller'].close();
        }else{
            that.afterCloseController();
        }
    };

    classProto.afterOpenController = function(){
        var that = this;
        that.isOpen = true;
        that.triggerEvent('onOpen', that.components['controller']);
    };

    classProto.afterOpenControllerEnd = function(){
        var that = this;
        that.isOpen = true;
        that.triggerEvent('onOpenEnd', that.components['controller']);
    };

    classProto.afterCloseController = function(){
        var that = this;
        that.isOpen = false;
        if(that.params['destructOnClose']){
            that.destructController();
        }
        that.triggerEvent('onClose', that.components['controller']);
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
    };

    classProto.constructPlaceholder = function(classObject){
        var that = this;
        return new classObject(
            cm.merge(that.params['placeholderParams'], {
                'opener' : that,
                'content' : that.nodes['placeholder']
            })
        );
    };

    classProto.renderPlaceholderView = function(){
        var that = this;
        that.triggerEvent('onRenderPlaceholderViewStart');
        // Structure
        that.nodes['placeholder'] = {};
        that.nodes['placeholder']['title'] = that.renderPlaceholderTitle();
        that.nodes['placeholder']['content'] = cm.node('div', {'class' : 'com__container__content'});
        that.nodes['placeholder']['help'] = that.lang('help');
        // Events
        that.triggerEvent('onRenderPlaceholderViewProcess');
        that.triggerEvent('onRenderPlaceholderViewEnd');
    };

    classProto.renderPlaceholderTitle = function(){
        var that = this;
        return cm.textNode(that.lang('title'));
    };

    classProto.renderPlaceholderButtons = function(){
        var that = this;
        that.components['placeholder'].addButton({
            'name' : 'close',
            'label' : that.lang('close'),
            'style' : 'button-primary',
            'callback' : that.closeHandler
        });
    };

    classProto.renderPlaceholderEvents = function(){
        var that = this;
        that.components['placeholder'].addEvent('onOpen', that.afterOpenPlaceholderHandler);
        that.components['placeholder'].addEvent('onOpenEnd', that.afterOpenPlaceholderEndHandler);
        that.components['placeholder'].addEvent('onClose', that.afterClosePlaceholderHandler);
    };

    classProto.destructPlaceholder = function(){
        var that = this;
        that.components['placeholder'] && that.components['placeholder'].destruct && that.components['placeholder'].destruct();
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
    };

    classProto.closePlaceholder = function(){
        var that = this;
        if(that.components['placeholder'] && that.components['placeholder'].close){
            that.components['placeholder'].close();
        }else{
            that.afterClosePlaceholder();
        }
    };

    classProto.afterOpenPlaceholder = function(){
        var that = this;
        that.openController();
        that.constructCollector();
        that.triggerEvent('onOpenPlaceholder', that.components['placeholder']);
    };

    classProto.afterOpenPlaceholderEnd = function(){
        var that = this;
        that.afterOpenControllerEnd();
        that.triggerEvent('onOpenPlaceholderEnd', that.components['placeholder']);
    };

    classProto.afterClosePlaceholder = function(){
        var that = this;
        that.closeController();
        if(that.params['destructOnClose']){
            that.destructPlaceholder();
            that.destructCollector();
        }
        that.triggerEvent('onClosePlaceholder', that.components['placeholder']);
    };
});
