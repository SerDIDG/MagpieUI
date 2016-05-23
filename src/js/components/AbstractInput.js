cm.define('Com.AbstractInput', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onRedraw',
        'onSet',
        'onSelect',
        'onChange',
        'onDisable',
        'onEnable'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'customEvents' : true,
        'value' : null,
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
    that.isDestructed = false;
    that.previousValue = null;
    that.value = null;
    that.disabled = false;
    that.construct(params);
});

cm.getConstructor('Com.AbstractInput', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        that.redrawHandler = that.redraw.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.setHandler = that.setAction.bind(that);
        that.selectHandler = that.selectAction.bind(that);
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.setEvents();
        that.set(that.params['value'], false);
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.unsetEvents();
            that.removeFromStack();
        }
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

    classProto.redraw = function(){
        var that = this;
        that.triggerEvent('onRedraw');
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
        return cm.node('div', {'class' : 'input__content'});
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

    classProto.setEvents = function(){
        var that = this;
        // Windows events
        cm.addEvent(window, 'resize', that.redrawHandler);
        // Add custom events
        if(that.params['customEvents']){
            cm.customEvent.add(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.add(that.nodes['container'], 'destruct', that.destructHandler);
        }
        return that;
    };

    classProto.unsetEvents = function(){
        var that = this;
        // Windows events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.nodes['container'], 'destruct', that.destructHandler);
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