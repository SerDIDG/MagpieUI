cm.define('Com.AbstractInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onClear',
        'onReset',
        'onDisable',
        'onEnable',
        'onRenderContent',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'renderStructure' : true,
        'renderStructureContent' : true,
        'value' : '',
        'defaultValue' : '',
        'title' : '',
        'placeholder' : '',
        'disabled' : false,
        'className' : '',
        'ui' : true,
        'size' : 'full',                // default | full
        'justify' : 'left',
        'maxlength' : 0,                // 0 - infinity
        'setHiddenInput' : true
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
        // Variables
        that.nodes = {};
        that.components = {};
        that.previousValue = null;
        that.value = null;
        that.rawValue = null;
        that.disabled = false;
        // Bind context to methods
        that.setHandler = that.set.bind(that);
        that.getHandler = that.get.bind(that);
        that.clearHandler = that.clear.bind(that);
        that.enableHandler = that.enable.bind(that);
        that.disableHandler = that.disable.bind(that);
        that.clearEventHandler = that.clearEvent.bind(that);
        that.setActionHandler = that.setAction.bind(that);
        that.selectActionHandler = that.selectAction.bind(that);
        that.afterRenderHandler = that.afterRender.bind(that);
        // Add events
        that.addEvent('onAfterRender', that.afterRenderHandler);
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

    classProto.getRaw = function(){
        var that = this;
        return that.rawValue;
    };

    classProto.reset = classProto.clear = function(triggerEvents){
        var that = this;
        if(!that.isDestructed){
            triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
            triggerEvents && that.triggerEvent('onClear');
            triggerEvents && that.triggerEvent('onReset');
            that.set(that.params['defaultValue'], triggerEvents);
        }
        return that;
    };

    classProto.enable = function(){
        var that = this;
        if(that.disabled){
            that.disabled = false;
            cm.removeClass(that.nodes['container'], 'disabled');
            cm.removeClass(that.nodes['contentContainer'], 'disabled');
            that.triggerEvent('onEnable');
        }
        return that;
    };

    classProto.disable = function(){
        var that = this;
        if(!that.disabled){
            that.disabled = true;
            cm.addClass(that.nodes['container'], 'disabled');
            cm.addClass(that.nodes['contentContainer'], 'disabled');
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
        var that = this,
            value;
        that.triggerEvent('onValidateParamsStart');
        // Get parameters from provided input
        if(cm.isNode(that.params['node'])){
            // In WebKit and Blink engines js value is cutoff, use DOM value instead.
            value = that.params['node'].getAttribute('value');
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['value'] = !cm.isEmpty(value) ?  value : that.params['value'];
            that.params['maxlength'] = that.params['node'].getAttribute('maxlength') || that.params['maxlength'];
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
        }
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.afterRender = function(){
        var that = this;
        that.set(that.params['value'], false);
        that.params['disabled'] && that.disable();
        return that;
    };

    /* *** VIEW - VIEW MODEL *** */

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'com__input'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'})
        );
        if(that.params['renderStructureContent']){
            that.nodes['contentContainer'] = that.renderContent();
            cm.appendChild(that.nodes['contentContainer'], that.nodes['container']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        // Structure
        that.triggerEvent('onRenderContentStart');
        nodes['container'] = cm.node('div', {'class' : 'input__content'});
        that.triggerEvent('onRenderContent');
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.setAttributes.apply(that, arguments);
        // Data attributes
        cm.forEach(that.params['node'].attributes, function(item){
            if(/^data-(?!node|element|config)/.test(item.name)){
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
        // Classes
        if(!cm.isEmpty(that.params['size'])){
            cm.addClass(that.nodes['container'], ['size', that.params['size']].join('-'));
        }
        if(!cm.isEmpty(that.params['justify'])){
            cm.addClass(that.nodes['container'], ['pull', that.params['justify']].join('-'));
        }
        return that;
    };

    /* *** DATA VALUE *** */

    classProto.validateValue = function(value){
        var that = this;
        value = !cm.isEmpty(value) ? value : that.params['defaultValue'];
        that.rawValue = value;
        return value;
    };

    classProto.saveValue = function(value){
        var that = this;
        that.previousValue = that.value;
        that.value = value;
        if(that.params['setHiddenInput']){
            if(!cm.isEmpty(value)){
                if(cm.isObject(value) || cm.isArray(value)){
                    that.nodes['hidden'].value = JSON.stringify(value);
                }else{
                    that.nodes['hidden'].value = value;
                }
            }else{
                that.nodes['hidden'].value = ''
            }
        }
        return that;
    };

    classProto.setData = function(){
        var that = this;
        return that;
    };

    /* *** ACTIONS *** */

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
        that.setData(value);
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