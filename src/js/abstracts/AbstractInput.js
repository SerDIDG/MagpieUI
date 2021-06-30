cm.define('Com.AbstractInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onInput',
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
        'renderHiddenContent' : true,
        'renderStructureContent' : true,
        'hiddenType' : 'hidden',
        'value' : '',
        'defaultValue' : '',
        'isValueOption' : false,
        'id' : '',
        'title' : '',
        'placeholder' : '',
        'autocomplete' : null,
        'ariaLabel' : '',
        'disabled' : false,
        'checked' : null,
        'className' : '',
        'contentClassName' : '',
        'adaptive' : true,
        'ui' : true,
        'size' : 'full',                // default | full
        'justify' : 'left',
        'required' : false,
        'minLength' : 0,
        'maxLength' : 0,                // 0 - infinity
        'min' : 0,
        'max' : 0,
        'setHiddenInput' : true,
        'setContentInput' : true
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractInput', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(params){
        var that = this;
        // Variables
        that.nodes = {};
        that.components = {};
        that.previousValue = null;
        that.value = null;
        that.valueText = null;
        that.valueOption = null;
        that.rawValue = null;
        that.tempRawValue = null;
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
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.selectAction(value, triggerEvents);
        that.setAction(value, triggerEvents);
        that.changeAction(triggerEvents);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.value;
    };

    classProto.getText = function(){
        var that = this;
        return that.valueText;
    };

    classProto.getRaw = function(){
        var that = this;
        return that.rawValue;
    };

    classProto.reset = classProto.clear = function(triggerEvents){
        var that = this;
        if(!that.isDestructed){
            triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
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
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        // Get parameters from provided input
        if(cm.isNode(that.params['node'])){
            that.params['id'] = that.params['node'].getAttribute('id') || that.params['id'];
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['checked'] = that.params['node'].checked || that.params['checked'];
            that.params['required'] = that.params['node'].required || that.params['required'];
            that.params['minLength'] = that.params['node'].getAttribute('minlength') || that.params['minLength'];
            that.params['maxLength'] = that.params['node'].getAttribute('maxlength') || that.params['maxLength'];
            that.params['min'] = that.params['node'].getAttribute('min') || that.params['min'];
            that.params['max'] = that.params['node'].getAttribute('max') || that.params['max'];
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['autocomplete'] = that.params['node'].getAttribute('autocomplete') || that.params['autocomplete'];
            that.params['ariaLabel'] = that.params['node'].getAttribute('aria-label') || that.params['ariaLabel'];
        }
        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        that.validateParamsValue();
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.validateParamsValue = function(){
        var that = this,
            dataValue,
            value;
        if(cm.isNode(that.params['node'])){
            dataValue = that.params['node'].getAttribute('data-value');
            // First try to take original value, than real time js value
            value = that.params['node'].getAttribute('value');
            if(cm.isEmpty(value)){
                value = that.params['node'].value;
            }
            // Parse JSON
            if(that.params['isValueOption'] && !cm.isEmpty(dataValue)){
                value = cm.parseJSON(dataValue);
            }
            that.params['value'] = !cm.isEmpty(value) ?  value : that.params['value'];
        }
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
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
        that.nodes['container'] = cm.node('div', {'class' : 'com__input'});
        // Hidden input holder
        that.nodes['hiddenContainer'] = that.renderHiddenContent();
        that.nodes['hidden'] = that.nodes['hiddenContent']['input'];
        if(that.params['renderHiddenContent']){
            cm.appendChild(that.nodes['hiddenContainer'], that.nodes['container']);
        }
        // Component content
        cm.appendChild(that.nodes['contentContainer'], that.nodes['container']);
        if(that.params['renderStructureContent']){
            that.nodes['contentContainer'] = that.renderContent();
            cm.appendChild(that.nodes['contentContainer'], that.nodes['container']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderHiddenContent = function(){
        var that = this,
            nodes = {};
        that.nodes['hiddenContent'] = nodes;
        // Structure
        switch(that.params['hiddenType']){
            case 'textarea' :
                nodes['container'] = nodes['input'] = cm.node('textarea', {'class' : 'display-none'});
                break;
            case 'hidden':
            default:
                nodes['container'] = nodes['input'] = cm.node('input', {'type' : 'hidden'});
                break;
        }
        // Export
        return nodes['container'];
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
        classInherit.prototype.setAttributes.apply(that, arguments);
        // Hidden
        that.setHiddenAttributes();
        // Data attributes
        if(cm.isNode(that.params['node'])){
            cm.forEach(that.params['node'].attributes, function(item){
                if(/^data-(?!node|element|config)/.test(item.name)){
                    that.nodes['container'].setAttribute(item.name, item.value);
                }
            });
        }
        if(that.params['title']){
            that.nodes['container'].setAttribute('title', that.lang(that.params['title']));
        }
        // Classes
        if(that.params['adaptive']){
            cm.addClass(that.nodes['container'], 'is-adaptive');
        }
        if(!cm.isEmpty(that.params['size'])){
            cm.addClass(that.nodes['container'], ['size', that.params['size']].join('-'));
        }
        if(!cm.isEmpty(that.params['justify'])){
            cm.addClass(that.nodes['container'], ['pull', that.params['justify']].join('-'));
        }
        cm.addClass(that.nodes['content']['container'], that.params['contentClassName']);
        return that;
    };

    classProto.setHiddenAttributes = function(){
        var that = this;
        that.nodes['hidden'].required = that.params['required'];
        // Min / Max length
        if(!cm.isEmpty(that.params['minLength']) && that.params['minLength'] > 0){
            that.nodes['hidden'].minlength = that.params['minLength']
        }
        if(!cm.isEmpty(that.params['maxLength']) && that.params['maxLength'] > 0){
            that.nodes['hidden'].maxlength = that.params['maxLength'];
        }
        if(!cm.isEmpty(that.params['min']) && that.params['min'] > 0){
            that.nodes['hidden'].min = that.params['min'];
        }
        if(!cm.isEmpty(that.params['max']) && that.params['max'] > 0){
            that.nodes['hidden'].max = that.params['max'];
        }
        // Data attributes
        if(cm.isNode(that.params['node'])){
            cm.forEach(that.params['node'].attributes, function(item){
                if(/^data-(?!node|element|config)/.test(item.name)){
                    that.nodes['hidden'].setAttribute(item.name, item.value);
                }
            });
        }
        if(!cm.isEmpty(that.params['name'])){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
    };

    /* *** DATA VALUE *** */

    classProto.validateValue = function(value){
        var that = this;
        value = that.validateValueHelper(value);
        value = !cm.isEmpty(value) ? value : that.validateValueHelper(that.params['defaultValue']);
        return value;
    };

    classProto.validateValueHelper = function(value){
        var that = this;
        if(that.params['isValueOption'] && !cm.isEmpty(value)){
            if(cm.isObject(value)){
                value['value'] = !cm.isEmpty(value['value']) ? value['value'] : value['text'];
                value['text'] = !cm.isEmpty(value['text']) ? value['text'] : value['value'];
            }else{
                value = {
                    'value' : value,
                    'text' : value
                };
            }
        }
        return value;
    };

    classProto.saveValue = function(value){
        var that = this;
        that.rawValue = that.tempRawValue;
        that.previousValue = cm.clone(that.value);
        if(that.params['isValueOption']){
            that.value = value['value'];
            that.valueText = value['text'];
            that.valueOption = value;
        }else{
            that.value = value;
            that.valueText = value;
        }
        if(that.params['setHiddenInput']){
            that.saveHiddenValue(that.value);
        }
        if(that.params['setContentInput']){
            that.setData(that.valueText);
        }
        return that;
    };

    classProto.saveHiddenValue = function(value){
        var that = this;
        if(!cm.isEmpty(value)){
            if(cm.isObject(value) || cm.isArray(value)){
                that.nodes['hidden'].value = cm.stringifyJSON(value);
            }else{
                that.nodes['hidden'].value = value;
            }
        }else{
            that.nodes['hidden'].value = ''
        }
    };

    classProto.saveRawValue = function(value){
        var that = this;
        that.tempRawValue = value;
    };

    classProto.setData = function(value){
        var that = this;
    };

    classProto.selectData = function(value){
        var that = this;
    };

    /* *** ACTIONS *** */

    classProto.selectAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        value = that.validateValue(value);
        that.saveRawValue(value);
        that.selectData(value);
        triggerEvents && that.triggerEvent('onSelect', value);
        triggerEvents && that.triggerEvent('onInput', value);
        return that;
    };

    classProto.setAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        value = that.validateValue(value);
        that.saveRawValue(value);
        that.saveValue(value);
        triggerEvents && that.triggerEvent('onSet', that.value);
        return that;
    };

    classProto.changeAction = function(triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        if(triggerEvents && cm.stringifyJSON(that.value) !== cm.stringifyJSON(that.previousValue)){
            that.triggerEvent('onChange', that.value);
        }
        return that;
    };
});
