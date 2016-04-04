cm.define('Com.AbstractRange', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onSet',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'isInput' : true,
        'content' : null,
        'drag' : null,
        'className' : '',
        'theme' : 'theme--arrows',
        'min' : 0,
        'max' : 100,
        'value' : 0,
        'direction' : 'horizontal',
        'showCounter' : true,
        'customEvents' : true,
        'Com.Draggable' : {}
    }
},
function(params){
    var that = this;

    that.previousValue = null;
    that.value = null;
    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        that.render();
        that.set(that.params['value'], false);
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    /* ******* PUBLIC ******* */

    init();
});

cm.getConstructor('Com.AbstractRange', function(classConstructor, className, classProto){
    classProto.validateParams = function(){
        var that = this;
        if(that.params['isInput'] && cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['value'] = that.params['node'].getAttribute('value') || that.params['value'];
        }
        that.params['Com.Draggable']['direction'] = that.params['direction'];
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Structure
        that.renderView();
        // Draggable
        cm.getConstructor('Com.Draggable', function(classConstructor, className){
            that.components['draggable'] = new classConstructor(
                cm.merge(that.params[className], {
                    'target' : that.nodes['inner'],
                    'node' : that.nodes['drag'],
                    'limiter' : that.nodes['inner'],
                    'events' : {
                        'onStart' : function(){
                            switch(that.params['direction']){
                                case 'horizontal':
                                    cm.addClass(document.body, 'cm__cursor--col-resize');
                                    break;

                                case 'vertical':
                                    cm.addClass(document.body, 'cm__cursor--row-resize');
                                    break;
                            }
                            that.showCounter();
                        },
                        'onStop' : function(){
                            switch(that.params['direction']){
                                case 'horizontal':
                                    cm.removeClass(document.body, 'cm__cursor--col-resize');
                                    break;

                                case 'vertical':
                                    cm.removeClass(document.body, 'cm__cursor--row-resize');
                                    break;
                            }
                            that.hideCounter();
                        },
                        'onSelect' : function(my, data){
                            var value = that.getRangeValue(data);
                            that.setHelper(value, 'onSelect')
                        },
                        'onSet' : function(my, data){
                            var value = that.getRangeValue(data);
                            that.setHelper(value, 'onSet')
                        }
                    }
                })
            );
        });
        // Events
        that.setEvents();
        // Append
        that.embedStructure(that.nodes['container']);
        return that;
    };

    classProto.setEvents = function(){
        var that = this;
        that.redrawHandler = that.redraw.bind(that);
        that.destructHandler = that.destruct.bind(that);
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
        cm.removeEvent(window, 'resize', that.redrawHandler);
        // Remove custom events
        if(that.params['customEvents']){
            cm.customEvent.remove(that.nodes['container'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.nodes['container'], 'destruct', that.destructHandler);
        }
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__range'},
            that.nodes['range'] = cm.node('div', {'class' : 'pt__range'},
                that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                    that.nodes['drag'] = cm.node('div', {'class' : 'drag'},
                        that.nodes['dragContent'] = that.renderDraggable()
                    ),
                    that.nodes['range'] = cm.node('div', {'class' : 'range'},
                        that.nodes['rangeContent'] = that.renderContent()
                    )
                )
            )
        );
        // Counter
        that.nodes['counter'] = that.renderCounter();
        if(that.params['showCounter']){
            cm.insertFirst(that.nodes['counter'], that.nodes['drag']);
        }
        // Hidden input
        that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'});
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        if(that.params['isInput']){
            cm.insertFirst(that.nodes['hidden'], that.nodes['container']);
        }
        // Classes
        if(that.params['isInput']){
            cm.addClass(that.nodes['container'], 'is-input');
            cm.addClass(that.nodes['range'], 'is-input');
        }
        cm.addClass(that.nodes['container'], that.params['theme']);
        cm.addClass(that.nodes['range'], that.params['theme']);
        cm.addClass(that.nodes['container'], that.params['className']);
        cm.addClass(that.nodes['rangeContent'], 'range-helper');
        // Direction classes
        switch(that.params['direction']){
            case 'horizontal':
                cm.addClass(that.nodes['container'], 'is-horizontal');
                cm.addClass(that.nodes['range'], 'is-horizontal');
                cm.addClass(that.nodes['dragContent'], 'is-horizontal');
                cm.addClass(that.nodes['rangeContent'], 'is-horizontal');
                break;

            case 'vertical':
                cm.addClass(that.nodes['container'], 'is-vertical');
                cm.addClass(that.nodes['range'], 'is-vertical');
                cm.addClass(that.nodes['dragContent'], 'is-vertical');
                cm.addClass(that.nodes['rangeContent'], 'is-vertical');
                break;
        }
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        return that.params['content'] || cm.node('div', {'class' : 'range__content'});
    };

    classProto.renderDraggable = function(){
        var that = this;
        return that.params['drag'] || cm.node('div', {'class' : 'drag__content'});
    };

    classProto.renderCounter = function(){
        var that = this;
        return that.params['counter'] || cm.node('div', {'class' : 'counter'});
    };

    classProto.showCounter = function(){
        var that = this;
        cm.addClass(that.nodes['counter'], 'is-show');
        return that;
    };

    classProto.hideCounter = function(){
        var that = this;
        cm.removeClass(that.nodes['counter'], 'is-show');
        return that;
    };

    classProto.getRangeValue = function(data){
        var that = this,
            dimensions = that.components['draggable'].getDimensions(),
            xn = that.params['max'] - that.params['min'],
            yn,
            zn,
            value;
        switch(that.params['direction']){
            case 'horizontal':
                yn = dimensions['limiter']['absoluteWidth'];
                zn = (xn / yn) * data['left'];
                value = Math.floor(zn) + that.params['min'];
                break;

            case 'vertical':
                yn = dimensions['limiter']['absoluteHeight'];
                zn = (xn / yn) * data['top'];
                value = Math.floor(zn) + that.params['min'];
                break;
        }
        return value;
    };

    classProto.validateValue = function(value){
        var that = this;
        if(that.params['max'] > that.params['min']){
            value = Math.min(Math.max(value, that.params['min']), that.params['max']);
        }else{
            value = Math.max(Math.min(value, that.params['min']), that.params['max']);
        }
        return value;
    };

    classProto.setHelper = function(value, eventName){
        var that = this;
        value = that.validateValue(value);
        that.setCounter(value);
        // Trigger Events
        that.triggerEvent(eventName, value);
        if(eventName == 'onSelect'){
            that.setAction(value);
            that.changeAction();
        }
        return that;
    };

    classProto.setAction = function(value){
        var that = this;
        that.previousValue = that.value;
        that.value = value;
        that.nodes['hidden'].value = that.value;
        return that;
    };

    classProto.setDraggable = function(){
        var that = this,
            dimensions = that.components['draggable'].getDimensions(),
            value = that.value - that.params['min'],
            xn = that.params['max'] - that.params['min'],
            yn,
            zn,
            position = {
                'top' : 0,
                'left' : 0
            };
        switch(that.params['direction']){
            case 'horizontal':
                yn = dimensions['limiter']['absoluteWidth'];
                zn = (yn / xn) * value;
                position['left'] = Math.floor(zn);
                break;

            case 'vertical':
                yn = dimensions['limiter']['absoluteHeight'];
                zn = (yn / xn ) * value;
                position['top'] = Math.floor(zn);
                break;
        }
        that.components['draggable'].setPosition(position, false);
        return that;
    };

    classProto.setCounter = function(value){
        var that = this;
        that.nodes['counter'].innerHTML = value;
        return that;
    };

    classProto.changeAction = function(){
        var that = this;
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
        return that;
    };

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        value = that.validateValue(value);
        that.setCounter(value);
        that.setAction(value);
        that.setDraggable();
        // Trigger Event
        if(triggerEvents){
            that.triggerEvent('onSet', that.value);
            that.triggerEvent('onSelect', that.value);
            that.changeAction();
        }
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.value;
    };

    classProto.redraw = function(){
        var that = this;
        that.setDraggable();
        return that;
    };

    classProto.destruct = function(){
        var that = this;
        that.unsetEvents();
        that.removeFromStack();
        return that;
    };
});