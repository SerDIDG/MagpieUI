cm.define('Com.Menu', {
    extend: 'Com.AbstractController',
    events: [
        'onShow',
        'onHide',
    ],
    params: {
        controllerEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,
        embedStructure: 'append',

        targetEvent: 'click',
        top: 'targetHeight',
        left: 0,
        adaptiveFrom: null,
        adaptiveTop: null,
        adaptiveLeft: null,
        minWidth: 'targetWidth',
        iconClasses: ['cm-i', 'cm-i__chevron-down', 'xx-small'],

        tooltip: {
            constructor: 'Com.Tooltip',
            constructorParams: {
                className: 'com__menu-tooltip',
                targetEvent: 'click',
                hideOnReClick: true,
                theme: null,
                hold: true,
                delay: 0,
                ariaRole: 'menu',
            },
        },
    },
    strings: {
        label: 'Actions',
    },
},
function(params) {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Menu', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function() {
        const that = this;

        // Variables
        that.nodes = {
            button: cm.node('div'),
            target: cm.node('div'),
        };

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function(){
        const that = this;
        that.triggerEvent('onValidateParamsStart');

        // ToDo: deprecated legacy parameter
        if (!cm.isEmpty(that.params.event)) {
            that.params.targetEvent = that.params.event;
        }
        that.triggerEvent('onValidateParamsProcess');

        // Tooltip parameters
        const tooltipParams = [
            'targetEvent',
            'minWidth',
            'top',
            'left',
            'adaptiveFrom',
            'adaptiveTop',
            'adaptiveLeft',
        ];
        cm.forEach(tooltipParams, item => {
            if (typeof that.params[item] !== 'undefined') {
                that.params.tooltip.constructorParams[item] = that.params[item];
            }
        });

        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsEnd');
    };

    classProto.setAttributes = function(){
        const that = this;

        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);

        // Set accessible attributes
        that.nodes.container.setAttribute('role', 'button');
        that.nodes.container.setAttribute('tabindex', '0');
        that.nodes.container.setAttribute('aria-haspopup', 'true');
        that.nodes.container.setAttribute('aria-controls', 'menu');
    };

    classProto.renderView = function() {
        const that = this;

        // Structure
        that.nodes.container = cm.node('a', {classes: ['com__menu', 'com__menu--link'], title: that.msg('label')},
            cm.node('div', {classes: 'label'}, that.msg('label')),
            cm.node('div', {classes: that.params.iconClasses}),
            that.nodes.target = cm.node('div', {classes: ['pt__menu', 'pt__menu--tooltip']},
                that.nodes.holder = cm.node('ul', {classes: 'pt__menu-dropdown'})
            )
        );

        that.nodes.button = that.nodes.container;
    };

    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Tooltip
        cm.getConstructor(that.params.tooltip.constructor, classConstructor => {
            that.components.tooltip = new classConstructor(
                cm.merge(that.params.tooltip.constructorParams, {
                    target: that.nodes.container || that.nodes.button,
                    content: that.nodes.target,
                    events: {
                        onShowStart: function() {
                            cm.addClass(that.nodes.button, 'active');
                            that.components.tooltip.focus();
                            that.triggerEvent('onShow');
                        },
                        onHideStart: function() {
                            cm.removeClass(that.nodes.button, 'active');
                            that.nodes.button.focus();
                            that.triggerEvent('onHide');
                        },
                    },
                })
            );
        });
    };

    /******** PUBLIC ********/

    classProto.show = function() {
        const that = this;
        that.components.tooltip && that.components.tooltip.show();
        return that;
    };

    classProto.hide = function() {
        const that = this;
        that.components.tooltip && that.components.tooltip.hide();
        return that;
    };

    classProto.getNodes = function(key) {
        const that = this;
        return that.nodes[key] || that.nodes;
    };
});