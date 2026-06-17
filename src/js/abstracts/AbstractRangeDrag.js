cm.define('Com.AbstractRangeDrag', {
        extend: 'Com.AbstractController',
        events: [
            'onStart',
            'onStop',
            'onSet',
            'onSelect'
        ],
        params: {
            renderStructure: true,
            embedStructureOnRender: true,
            embedStructure: 'append',
            controllerEvents: true,

            min: 0,
            max: 0,
            value: 0,
            precision: 0,
            step: 0,
            direction: 'horizontal',
            showCounter: true,
            valueFormater: '{value}',

            targetDraggable: true,
            draggableConstructor: 'Com.Draggable',
            draggableParams: {}
        }
    },
    function() {
        Com.AbstractController.apply(this, arguments);
    });

cm.getConstructor('Com.AbstractRangeDrag', function(classConstructor, className, classProto, classInherit) {
    classProto.onValidateParams = function() {
        const that = this;
        that.params.draggableParams.direction = that.params.direction;
    };

    classProto.renderView = function() {
        const that = this;

        // Structure
        that.nodes.container = cm.node('div', {class: 'drag'},
            that.nodes.content = that.renderDragContent(name)
        );

        // Classes
        cm.addClass(that.nodes.content, that.params.theme);
        switch (that.params.direction) {
            case 'horizontal':
                cm.addClass(that.nodes.content, 'is-horizontal');
                break;
            case 'vertical':
                cm.addClass(that.nodes.content, 'is-vertical');
                break;
        }
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Constructor
        cm.getConstructor(that.params.draggableConstructor, classConstructor => {
            that.components.draggable = new classConstructor(
                cm.merge(that.params.draggableParams, {
                    target: that.params.targetDraggable ? that.params.node : null,
                    node: that.nodes.container,
                    limiter: that.params.node,
                    events: {
                        onStart: () => {
                            switch (that.params.direction) {
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
                        onStop: () => {
                            switch (that.params.direction) {
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
                        onSelect: (my, data) => {
                            const value = that.getDraggable(data);
                            that.selectAction(value, true);
                        },
                        onSet: (my, data) => {
                            const value = that.getDraggable(data);
                            that.set(value, true);
                        }
                    }
                })
            );
        });
    };

    /*** DRAGGABLE ***/

    classProto.renderDragContent = function() {
        const that = this;

        // Structure
        const nodes = that.nodes.dragContent = {};
        nodes.container = cm.node('div', {class: 'drag__content'});

        // Counter
        that.nodes.counter = that.renderCounter(name);
        if (that.params.showCounter) {
            cm.appendChild(that.nodes.counter, nodes.container);
        }

        // Export
        return nodes.container;
    };

    classProto.getDraggable = function(data) {
        const that = this;
        const dimensions = that.components.draggable.getDimensions();

        let xn = that.params.max - that.params.min,
            yn,
            zn,
            value;

        switch (that.params.direction) {
            case 'horizontal':
                yn = dimensions.limiter.absoluteWidth;
                zn = (xn / yn) * data.left;
                value = zn + that.params.min;
                break;

            case 'vertical':
                yn = dimensions.limiter.absoluteHeight;
                zn = (xn / yn) * data.top;
                value = zn + that.params.min;
                break;
        }

        // Apply step snapping
        if (that.params.step) {
            value = that.applyStep(value, that.params.min, that.params.step);
        }

        // Clamp
        if (that.params.max > that.params.min) {
            value = Math.max(that.params.min, Math.min(that.params.max, value));
        } else {
            value = Math.min(that.params.min, Math.max(that.params.max, value));
        }

        return cm.toFixed(value, that.params.precision, true);
    };

    classProto.setDraggable = function(value) {
        const that = this;
        const position = {top: 0, left: 0};
        const dimensions = that.components.draggable.getDimensions();

        // Snap incoming value to step
        if (that.params.step) {
            value = that.applyStep(value, that.params.min, that.params.step);
        }

        let xn = that.params.max - that.params.min,
            dv = value - that.params.min,
            yn,
            zn;

        switch (that.params.direction) {
            case 'horizontal':
                yn = dimensions.limiter.absoluteWidth;
                zn = (yn / xn) * dv;
                position.left = cm.toFixed(zn, that.params.precision, true);
                break;

            case 'vertical':
                yn = dimensions.limiter.absoluteHeight;
                zn = (yn / xn) * dv;
                position.top = cm.toFixed(zn, that.params.precision, true);
                break;
        }

        that.components.draggable.setPosition(position, false);
    };

    /*** COUNTER ***/

    classProto.renderCounter = function() {
        const that = this;

        // Structure
        const nodes = that.nodes.counterContent = {};
        nodes.container = nodes.inner = cm.node('div', {classes: 'counter'});

        // Export
        return nodes.container;
    };

    classProto.showCounter = function() {
        const that = this;
        cm.addClass(that.nodes.counter, 'is-show');
        return that;
    };

    classProto.hideCounter = function() {
        const that = this;
        cm.removeClass(that.nodes.counter, 'is-show');
        return that;
    };

    classProto.setCounter = function(value) {
        const that = this;
        that.nodes.counterContent.inner.innerText = cm.parseMessage(that.params.valueFormater, {value});
    };

    /******* HELPERS  *******/

    classProto.applyStep = function(value, min, step) {
        return Math.round((value - min) / step) * step + min;
    };

    /*** VALUE ***/

    classProto.get = function() {
        const that = this;
        const data = that.components.draggable.get();
        return that.getDraggable(data);
    };

    classProto.selectAction = function(value, triggerEvents) {
        const that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.setCounter(value);
        triggerEvents && that.triggerEvent('onSelect', value);
        return that;
    };

    classProto.set = function(value, triggerEvents) {
        const that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.setDraggable(value);
        that.setCounter(value);
        triggerEvents && that.triggerEvent('onSet', value);
        return that;
    };
});