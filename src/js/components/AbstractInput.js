cm.define('Com.AbstractInput', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSet',
        'onSelect',
        'onChange',
        'onDisable',
        'onEnable',
        'onRenderContentStart',
        'onRenderContent',
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
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(params){
        var that = this;
        that.clearHandler = that.clear.bind(that);
        that.setActionHandler = that.setAction.bind(that);
        that.selectActionHandler = that.selectAction.bind(that);
        that.addEvent('onConstruct', function(){
            that.set(that.params['value'], false);
        });
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
        that.set(that.params['defaultValue'], triggerEvents);
        return that;
    };

    classProto.enable = function(){
        var that = this;
        that.disabled = false;
        cm.removeClass(cm.nodes['container'], 'disabled');
        cm.removeClass(cm.nodes['content'], 'disabled');
        that.triggerEvent('onEnable');
        return that;
    };

    classProto.disable = function(){
        var that = this;
        that.disabled = true;
        cm.addClass(that.nodes['container'], 'disabled');
        cm.addClass(that.nodes['content'], 'disabled');
        that.triggerEvent('onDisable');
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        _inherit.prototype.validateParams.apply(that, arguments);
        // Get parameters from provided input
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
            that.params['value'] = that.params['node'].value || that.params['value'];
        }
        that.disabled = that.params['disabled'];
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        // Attributes
        that.setAttributes();
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.nodes['container'] = cm.node('div', {'class' : 'com__input'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            that.nodes['content'] = that.renderContent()
        );
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        var node = cm.node('div', {'class' : 'input__content'});
        that.triggerEvent('onRenderContent');
        that.triggerEvent('onRenderContentEnd');
        return node;
    };

    classProto.setAttributes = function(){
        var that = this;
        cm.addClass(that.nodes['container'], that.params['className']);
        // Data attributes
        cm.forEach(that.params['node'].attributes, function(item){
            if(/^data-(?!node|element)/.test(item.name)){
                that.nodes['hidden'].setAttribute(item.name, item.value);
            }
        });
        if(that.params['title']){
            that.nodes['container'].setAttribute('title', that.lang(that.params['title']));
        }
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        return that;
    };

    classProto.validateValue = function(value){
        return value;
    };

    classProto.selectAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        if(triggerEvents){
            that.triggerEvent('onSelect', value);
        }
        return that;
    };

    classProto.setAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.previousValue = that.value;
        that.value = value;
        that.nodes['hidden'].value = that.value;
        if(triggerEvents){
            that.triggerEvent('onSet', that.value);
        }
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