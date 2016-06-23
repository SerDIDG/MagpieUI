cm.define('Com.AbstractInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onClear',
        'onDisable',
        'onEnable',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'value' : '',
        'defaultValue' : '',
        'title' : '',
        'disabled' : false,
        'className' : '',
        'ui' : true,
        'maxlength' : 0                 // 0 - infinity
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    that.previousValue = null;
    that.value = null;
    that.disabled = false;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
        // Bind context to methods
        that.setHandler = that.set.bind(that);
        that.getHandler = that.get.bind(that);
        that.clearHandler = that.clear.bind(that);
        that.enableHandler = that.enable.bind(that);
        that.disableHandler = that.disable.bind(that);
        that.clearEventHandler = that.clearEvent.bind(that);
        that.setActionHandler = that.setAction.bind(that);
        that.selectActionHandler = that.selectAction.bind(that);
        that.constructProcessHandler = that.constructProcess.bind(that);
        // Add events
        that.addEvent('onConstructProcess', that.constructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        value = that.validateValue(value);
        that.selectAction(value, triggerEvents);
        that.setAction(value, triggerEvents);
        that.changeAction(triggerEvents);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.value;
    };

    classProto.clear = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        triggerEvents && that.triggerEvent('onClear');
        that.set(that.params['defaultValue'], triggerEvents);
        return that;
    };

    classProto.enable = function(){
        var that = this;
        if(!that.disabled){
            that.disabled = false;
            cm.removeClass(that.nodes['container'], 'disabled');
            cm.removeClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function(){
        var that = this;
        if(that.disabled){
            that.disabled = true;
            cm.addClass(that.nodes['container'], 'disabled');
            cm.addClass(that.nodes['content'], 'disabled');
            that.triggerEvent('onDisable');
        }
        return that;
    };

    classProto.clearEvent = function(e){
        var that = this;
        cm.preventDefault(e);
        that.clear();
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        // Get parameters from provided input
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['value'] = that.params['node'].value || that.params['value'];
        }
        that.disabled = that.params['disabled'];
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.constructProcess = function(){
        var that = this;
        that.set(that.params['value'], false);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__input'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            that.nodes['content'] = that.renderContent()
        );
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        var node = cm.node('div', {'class' : 'input__content'});
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        return node;
    };

    classProto.setAttributes = function(){
        var that = this;
        that.triggerEvent('onSetAttributesStart');
        cm.addClass(that.nodes['container'], that.params['className']);
        // Data attributes
        cm.forEach(that.params['node'].attributes, function(item){
            if(/^data-(?!node|element)/.test(item.name)){
                that.nodes['hidden'].setAttribute(item.name, item.value);
                that.nodes['container'].setAttribute(item.name, item.value);
            }
        });
        if(that.params['title']){
            that.nodes['container'].setAttribute('title', that.lang(that.params['title']));
        }
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        that.triggerEvent('onSetAttributesEnd');
        return that;
    };

    classProto.validateValue = function(value){
        return value;
    };

    classProto.saveValue = function(value){
        var that = this;
        that.previousValue = that.value;
        that.value = value;
        that.nodes['hidden'].value = value;
        return that;
    };

    classProto.selectAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        triggerEvents && that.triggerEvent('onSelect', value);
        return that;
    };

    classProto.setAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.saveValue(value);
        triggerEvents && that.triggerEvent('onSet', that.value);
        return that;
    };

    classProto.changeAction = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(triggerEvents && that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
        return that;
    };
});