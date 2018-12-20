cm.define('Com.AbstractRangeDrag', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onStart',
        'onStop',
        'onSet',
        'onSelect'
    ],
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'embedStructure' : 'append',
        'controllerEvents' : true,
        'direction' : 'horizontal',
        'showCounter' : true,
        'targetDraggable' : true,
        'draggableConstructor' : 'Com.Draggable',
        'draggableParams' : {}
    }
},
function(params){
    var that = this;
    // Call parent class construct in current context
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractRangeDrag', function(classConstructor, className, classProto, classInherit){
    classProto.onValidateParams = function(){
        var that = this;
        that.params['draggableParams']['direction'] = that.params['direction'];
    };

    classProto.renderView = function(){
        var that = this;
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'drag'},
            that.nodes['content'] = that.renderDragContent(name)
        );
        // Classes
        cm.addClass(that.nodes['content'], that.params['theme']);
        switch(that.params['direction']){
            case 'horizontal':
                cm.addClass(that.nodes['content'], 'is-horizontal');
                break;
            case 'vertical':
                cm.addClass(that.nodes['content'], 'is-vertical');
                break;
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Constructor
        cm.getConstructor(that.params['draggableConstructor'], function(classConstructor){
            that.components['draggable'] = new classConstructor(
                cm.merge(that.params['draggableParams'], {
                    'target' : that.params['targetDraggable'] ?  that.params['node'] : null,
                    'node' : that.nodes['container'],
                    'limiter' : that.params['node'],
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
                            that.triggerEvent('onStart');
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
                            that.triggerEvent('onStop');
                        },
                        'onSelect' : function(my, data){
                            var value = that.getDraggable(data);
                            that.selectAction(value, true);
                        },
                        'onSet' : function(my, data){
                            var value = that.getDraggable(data);
                            that.set(value, true);
                        }
                    }
                })
            );
        });
    };

    /*** DRAGGABLE ***/

    classProto.renderDragContent = function(){
        var that = this,
            nodes = {};
        that.nodes['dragContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'drag__content'});
        // Counter
        that.nodes['counter'] = that.renderCounter(name);
        if(that.params['showCounter']){
            cm.appendChild(that.nodes['counter'], nodes['container']);
        }
        // Export
        return nodes['container'];
    };

    classProto.getDraggable = function(data){
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
                value = Math.round(zn) + that.params['min'];
                break;
            case 'vertical':
                yn = dimensions['limiter']['absoluteHeight'];
                zn = (xn / yn) * data['top'];
                value = Math.round(zn) + that.params['min'];
                break;
        }
        return value;
    };

    classProto.setDraggable = function(value){
        var that = this,
            position = {
                'top' : 0,
                'left' : 0
            },
            dimensions = that.components['draggable'].getDimensions(),
            dv = value - that.params['min'],
            xn = that.params['max'] - that.params['min'],
            yn,
            zn;
        switch(that.params['direction']){
            case 'horizontal':
                yn = dimensions['limiter']['absoluteWidth'];
                zn = (yn / xn) * dv;
                position['left'] = Math.round(zn);
                break;
            case 'vertical':
                yn = dimensions['limiter']['absoluteHeight'];
                zn = (yn / xn) * dv;
                position['top'] = Math.round(zn);
                break;
        }
        that.components['draggable'].setPosition(position, false);
    };

    /*** COUNTER ***/

    classProto.renderCounter = function(){
        var that = this,
            nodes = {};
        that.nodes['counterContent'] = nodes;
        // Structure
        nodes['container'] = nodes['inner'] = cm.node('div', {'class' : 'counter'});
        // Export
        return nodes['container'];
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

    classProto.setCounter = function(value){
        var that = this;
        that.nodes['counterContent']['inner'].innerHTML = value;
    };

    /*** VALUE ***/

    classProto.get = function(){
        var that = this,
            data = that.components['draggable'].get(),
            value = that.getDraggable(data);
        return value;
    };

    classProto.selectAction = function(value, triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.setCounter(value);
        triggerEvents && that.triggerEvent('onSelect', value);
        return that;
    };

    classProto.set = function(value, triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.setDraggable(value);
        that.setCounter(value);
        triggerEvents && that.triggerEvent('onSet', value);
        return that;
    };
});