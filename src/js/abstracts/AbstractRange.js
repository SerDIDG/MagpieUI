cm.define('Com.AbstractRange', {
    extend: 'Com.AbstractInput',
    params: {
        renderStructure: true,
        embedStructureOnRender: true,
        controllerEvents: true,
        redrawOnRender: true,
        className: 'com__range',
        theme: 'theme--arrows',

        min: 0,
        max: 100,
        value: 0,
        precision: 0,
        step: 1,
        range: false,
        direction: 'horizontal',
        showCounter: true,
        valueFormater: '{value}',

        draggableConstructor: 'Com.AbstractRangeDrag',
        draggableParams: {}
    }
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.AbstractRange', function(classConstructor, className, classProto, classInherit) {
    classProto.onConstructStart = function() {
        const that = this;

        // Variables
        that.components.draggable = [];
        that.sort = 'asc';
    };

    classProto.onRedraw = function() {
        const that = this;
        that.setData();
    };

    classProto.onValidateParamsEnd = function() {
        const that = this;

        // Sort
        that.sort = (that.params.min > that.params.max) ? 'desc' : 'asc';
        that.targetDraggable = !that.params.range;

        // Configure draggable
        that.params.draggableParams.theme = that.params.theme;
        that.params.draggableParams.direction = that.params.direction;
        that.params.draggableParams.targetDraggable = that.targetDraggable;
        that.params.draggableParams.min = that.params.min;
        that.params.draggableParams.max = that.params.max;
        that.params.draggableParams.precision = that.params.precision;
        that.params.draggableParams.step = that.params.step;
        that.params.draggableParams.showCounter = that.params.showCounter;
        that.params.draggableParams.valueFormater = that.params.valueFormater;
    };

    /*** VIEW MODEL ***/

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Draggable
        that.renderDraggable();
        if (that.params.range) {
            that.renderDraggable();
        }
    };

    classProto.renderContent = function() {
        const that = this;
        that.triggerEvent('onRenderContentStart');

        // Structure
        const nodes = that.nodes.content = {};
        nodes.container = cm.node('div', {classes: 'com__range__content'},
            nodes.range = cm.node('div', {classes: 'pt__range'},
                nodes.inner = cm.node('div', {classes: 'inner'},
                    nodes.range = cm.node('div', {classes: 'range'},
                        nodes.rangeContent = that.renderRangeContent()
                    )
                )
            )
        );
        that.triggerEvent('onRenderContentProcess');

        // Classes
        cm.addClass(nodes.rangeContent, 'range-helper');
        cm.addClass(nodes.container, that.params.theme);
        cm.addClass(nodes.range, that.params.theme);
        cm.addClass(nodes.rangeContent, that.params.theme);
        that.targetDraggable && cm.addClass(nodes.range, 'is-draggable');

        // Direction classes
        switch (that.params.direction) {
            case 'horizontal':
                cm.addClass(nodes.container, 'is-horizontal');
                cm.addClass(nodes.range, 'is-horizontal');
                cm.addClass(nodes.rangeContent, 'is-horizontal');
                break;

            case 'vertical':
                cm.addClass(nodes.container, 'is-vertical');
                cm.addClass(nodes.range, 'is-vertical');
                cm.addClass(nodes.rangeContent, 'is-vertical');
                break;
        }

        // Events
        that.triggerEvent('onRenderContentEnd');

        // Export
        return nodes.container;
    };

    /*** RANGE ***/

    classProto.renderRangeContent = function() {
        const that = this;

        // Structure
        const nodes = that.nodes.rangeContent = {};
        nodes.container = cm.node('div', {classes: 'range__content'});

        // Export
        return nodes.container;
    };

    /*** DRAGGABLE ***/

    classProto.renderDraggable = function() {
        const that = this;
        cm.getConstructor(that.params.draggableConstructor, classConstructor => {
            const component = new classConstructor(
                cm.merge(that.params.draggableParams, {
                    node: that.nodes.content.inner,
                    events: {
                        onStart: () => {
                            that.setEditing();
                        },
                        onStop: () => {
                            that.unsetEditing();
                        },
                        onSelect: (my, value) => {
                            that.setValues();
                            that.selectAction(that.tempRawValue.join('-'), true);
                        },
                        onSet: (my, value) => {
                            that.setValues();
                            that.set(that.tempRawValue.join('-'), true);
                        }
                    }
                })
            );
            that.components.draggable.push(component);
        });
    };

    /*** DATA ***/

    classProto.setValues = function() {
        const that = this;
        that.tempRawValue = [];
        cm.forEach(that.components.draggable, (item) => {
            that.tempRawValue.push(item.get());
        });
        that.tempRawValue = cm.arraySort(that.tempRawValue, false, that.sort);
    };

    classProto.validateValue = function(value) {
        const that = this;
        const values = value.toString().split('-');
        cm.forEach(values, (item, i) => {
            if (that.params.max > that.params.min) {
                values[i] = Math.min(Math.max(parseFloat(item), that.params.min), that.params.max);
            } else {
                values[i] = Math.max(Math.min(parseFloat(item), that.params.min), that.params.max);
            }
        });
        that.values = cm.arraySort(values, false, that.sort);
        return values.join('-');
    };

    classProto.saveRawValue = function(value) {
        const that = this;
        that.tempRawValue = value.toString().split('-');
        that.tempRawValue = cm.arrayParseFloat(that.tempRawValue);
        that.tempRawValue = cm.arraySort(that.tempRawValue, false, that.sort);
    };

    classProto.setData = function() {
        const that = this;
        if (!cm.isEmpty(that.tempRawValue)) {
            cm.forEach(that.components.draggable, (item, i) => {
                item.set(that.tempRawValue[i], false);
            });
        }
    };

    /*** PUBLIC ***/

    classProto.setEditing = function() {
        const that = this;
        cm.addClass(that.nodes.content.container, 'is-editing');
        cm.addClass(that.nodes.content.range, 'is-editing');
        cm.addClass(that.nodes.content.rangeContent, 'is-editing');
        return that;
    };

    classProto.unsetEditing = function() {
        const that = this;
        cm.removeClass(that.nodes.content.container, 'is-editing');
        cm.removeClass(that.nodes.content.range, 'is-editing');
        cm.removeClass(that.nodes.content.rangeContent, 'is-editing');
        return that;
    };
});