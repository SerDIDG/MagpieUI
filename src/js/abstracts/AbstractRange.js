cm.define('Com.AbstractRange', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'controllerEvents' : true,
        'redrawOnRender' : true,
        'className' : 'com__range',
        'theme' : 'theme--arrows',
        'min' : 0,
        'max' : 100,
        'value' : 0,
        'range' : false,
        'direction' : 'horizontal',
        'showCounter' : true,
        'draggableConstructor' : 'Com.AbstractRangeDrag',
        'draggableParams' : {}
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.AbstractRange', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that.components['draggable'] = [];
        that.sort = 'asc';
    };

    classProto.onRedraw = function(){
        var that = this;
        that.setData();
    };

    classProto.onValidateParamsEnd = function(){
        var that = this;
        // Sort
        that.sort = (that.params['min'] > that.params['max']) ? 'asc' : 'desc';
        that.targetDraggable = !that.params['range'];
        // Configure draggable
        that.params['draggableParams']['theme'] = that.params['theme'];
        that.params['draggableParams']['direction'] = that.params['direction'];
        that.params['draggableParams']['targetDraggable'] = that.targetDraggable;
        that.params['draggableParams']['min'] = that.params['min'];
        that.params['draggableParams']['max'] = that.params['max'];
    };

    /*** VIEW MODEL ***/

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Draggable
        that.renderDraggable();
        if(that.params['range']){
            that.renderDraggable();
        }
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
                    nodes['range'] = cm.node('div', {'class' : 'range'},
                        nodes['rangeContent'] = that.renderRangeContent()
                    )
                )
            )
        );
        that.triggerEvent('onRenderContentProcess');
        // Classes
        cm.addClass(nodes['rangeContent'], 'range-helper');
        cm.addClass(nodes['container'], that.params['theme']);
        cm.addClass(nodes['range'], that.params['theme']);
        cm.addClass(nodes['rangeContent'], that.params['theme']);
        that.targetDraggable && cm.addClass(nodes['range'], 'is-draggable');
        // Direction classes
        switch(that.params['direction']){
            case 'horizontal':
                cm.addClass(nodes['container'], 'is-horizontal');
                cm.addClass(nodes['range'], 'is-horizontal');
                cm.addClass(nodes['rangeContent'], 'is-horizontal');
                break;

            case 'vertical':
                cm.addClass(nodes['container'], 'is-vertical');
                cm.addClass(nodes['range'], 'is-vertical');
                cm.addClass(nodes['rangeContent'], 'is-vertical');
                break;
        }
        // Events
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
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

    /*** DRAGGABLE ***/

    classProto.renderDraggable = function(){
        var that = this;
        cm.getConstructor(that.params['draggableConstructor'], function(classConstructor){
            that.components['draggable'].push(
                new classConstructor(
                    cm.merge(that.params['draggableParams'], {
                        'node' : that.nodes['content']['inner'],
                        'events' : {
                            'onStart' : function(){
                                that.setEditing();
                            },
                            'onStop' : function(){
                                that.unsetEditing();
                            },
                            'onSelect' : function(my, value){
                                that.setValues();
                                that.selectAction(that.tempRawValue.join('-'), true);
                            },
                            'onSet' : function(my, value){
                                that.setValues();
                                that.set(that.tempRawValue.join('-'), true);
                            }
                        }
                    })
                )
            );
        });
    };

    /*** DATA ***/

    classProto.setValues = function(){
        var that = this;
        that.tempRawValue = [];
        cm.forEach(that.components['draggable'], function(item){
            that.tempRawValue.push(item.get());
        });
        that.tempRawValue = cm.arraySort(that.tempRawValue, false, that.sort);
    };

    classProto.validateValue = function(value){
        var that = this,
            values = value.toString().split('-');
        cm.forEach(values, function(item, i){
            if(that.params['max'] > that.params['min']){
                values[i] = Math.min(Math.max(parseFloat(item), that.params['min']), that.params['max']);
            }else{
                values[i] = Math.max(Math.min(parseFloat(item), that.params['min']), that.params['max']);
            }
        });
        that.values = cm.arraySort(values, false, that.sort);
        return values.join('-');
    };

    classProto.saveRawValue = function(value){
        var that = this;
        that.tempRawValue = value.toString().split('-');
        that.tempRawValue = cm.arrayParseFloat(that.tempRawValue);
        that.tempRawValue = cm.arraySort(that.tempRawValue, false, that.sort);
    };

    classProto.setData = function(){
        var that = this;
        if(!cm.isEmpty(that.tempRawValue)){
            cm.forEach(that.components['draggable'], function(item, i){
                item.set(that.tempRawValue[i], false);
            });
        }
    };

    /*** PUBLIC ***/

    classProto.setEditing = function(){
        var that = this;
        cm.addClass(that.nodes['content']['container'], 'is-editing');
        cm.addClass(that.nodes['content']['range'], 'is-editing');
        cm.addClass(that.nodes['content']['rangeContent'], 'is-editing');
        return that;
    };

    classProto.unsetEditing = function(){
        var that = this;
        cm.removeClass(that.nodes['content']['container'], 'is-editing');
        cm.removeClass(that.nodes['content']['range'], 'is-editing');
        cm.removeClass(that.nodes['content']['rangeContent'], 'is-editing');
        return that;
    };
});