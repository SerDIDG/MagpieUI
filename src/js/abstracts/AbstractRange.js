cm.define('Com.AbstractRange', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'controllerEvents' : true,
        'className' : 'com__range',
        'theme' : 'theme--arrows is-input',
        'min' : 0,
        'max' : 100,
        'value' : 0,
        'direction' : 'horizontal',
        'showCounter' : true,
        'Com.Draggable' : {}
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.AbstractRange', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.onRedraw = function(){
        var that = this;
        that.setDraggable(that.value);
    };

    classProto.onValidateParamsEnd = function(){
        var that = this;
        that.params['Com.Draggable']['direction'] = that.params['direction'];
    };

    /*** VIEW MODEL ***/

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Draggable
        cm.getConstructor('Com.Draggable', function(classConstructor, className){
            that.components['draggable'] = new classConstructor(
                cm.merge(that.params[className], {
                    'target' : that.nodes['content']['inner'],
                    'node' : that.nodes['content']['drag'],
                    'limiter' : that.nodes['content']['inner'],
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
                            that.selectAction(value, true);
                        },
                        'onSet' : function(my, data){
                            var value = that.getRangeValue(data);
                            that.set(value, true);
                        }
                    }
                })
            );
        });
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__range__content'},
            nodes['range'] = cm.node('div', {'class' : 'pt__range'},
                nodes['inner'] = cm.node('div', {'class' : 'inner'},
                    nodes['drag'] = cm.node('div', {'class' : 'drag'},
                        nodes['dragContent'] = that.renderDraggable()
                    ),
                    nodes['range'] = cm.node('div', {'class' : 'range'},
                        nodes['rangeContent'] = that.renderRangeContent()
                    )
                )
            )
        );
        that.triggerEvent('onRenderContentProcess');
        // Counter
        nodes['counter'] = that.renderCounter();
        if(that.params['showCounter']){
            cm.insertFirst(nodes['counter'], nodes['drag']);
        }
        // Classes
        cm.addClass(nodes['rangeContent'], 'range-helper');
        cm.addClass(nodes['container'], that.params['theme']);
        cm.addClass(nodes['range'], that.params['theme']);
        cm.addClass(nodes['dragContent'], that.params['theme']);
        cm.addClass(nodes['rangeContent'], that.params['theme']);
        // Direction classes
        switch(that.params['direction']){
            case 'horizontal':
                cm.addClass(nodes['container'], 'is-horizontal');
                cm.addClass(nodes['range'], 'is-horizontal');
                cm.addClass(nodes['dragContent'], 'is-horizontal');
                cm.addClass(nodes['rangeContent'], 'is-horizontal');
                break;

            case 'vertical':
                cm.addClass(nodes['container'], 'is-vertical');
                cm.addClass(nodes['range'], 'is-vertical');
                cm.addClass(nodes['dragContent'], 'is-vertical');
                cm.addClass(nodes['rangeContent'], 'is-vertical');
                break;
        }
        // Events
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
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
        cm.addClass(that.nodes['counterContent']['container'], 'is-show');
        return that;
    };

    classProto.hideCounter = function(){
        var that = this;
        cm.removeClass(that.nodes['counterContent']['container'], 'is-show');
        return that;
    };

    classProto.setCounter = function(value){
        var that = this;
        that.nodes['counterContent']['inner'].innerHTML = value;
    };

    /*** RANGE ***/

    classProto.renderRangeContent = function(){
        var that = this,
            nodes = {};
        that.nodes['rangeContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'range__content'});
        // Export
        return nodes['container'];
    };

    classProto.renderDraggable = function(){
        var that = this,
            nodes = {};
        that.nodes['dragContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'drag__content'});
        // Export
        return nodes['container'];
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

    classProto.setDraggable = function(value){
        var that = this,
            position = {
                'top' : 0,
                'left' : 0
            },
            dimensions = that.components['draggable'].getDimensions(),
            xn = that.params['max'] - that.params['min'],
            yn,
            zn;
        value = value - that.params['min'];
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
    };

    /*** DATA ***/

    classProto.validateValue = function(value){
        var that = this;
        if(that.params['max'] > that.params['min']){
            value = Math.min(Math.max(value, that.params['min']), that.params['max']);
        }else{
            value = Math.max(Math.min(value, that.params['min']), that.params['max']);
        }
        return value;
    };

    classProto.selectData = function(value){
        var that = this;
        that.setCounter(value);
    };

    classProto.setData = function(value){
        var that = this;
        that.setCounter(value);
        that.setDraggable();
    };
});