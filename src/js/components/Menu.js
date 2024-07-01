cm.define('Com.Menu', {
    extend: 'Com.AbstractController',
    params: {
        controllerEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,
        embedStructure: 'append',

        iconClasses: ['cm-i', 'cm-i__chevron-down', 'xx-small'],
        targetEvent: 'hover',
        top: 'targetHeight',
        left: 0,
        adaptiveFrom: null,
        adaptiveTop: null,
        adaptiveLeft: null,
        minWidth: 'targetWidth',

        tooltipConstructor: 'Com.Tooltip',
        tooltipParams: {
            className: 'com__menu-tooltip',
            targetEvent: 'hover',
            hideOnReClick: true,
            theme: null,
            hold: true,
            delay: 'cm._config.hideDelay',
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
        var that = this;

        // Variables
        that.nodes = {
            button: cm.node('div'),
            target: cm.node('div'),
        };

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');

        // ToDo: deprecated legacy parameter
        if (!cm.isEmpty(that.params.event)) {
            that.params.targetEvent = that.params.event;
        }

        // Tooltip parameters
        var tooltipParams = [
            'targetEvent',
            'minWidth',
            'top',
            'left',
            'adaptiveFrom',
            'adaptiveTop',
            'adaptiveLeft',
        ];
        cm.forEach(tooltipParams, function(item) {
            if (typeof that.params[item] !== 'undefined') {
                that.params.tooltipParams[item] = that.params[item];
            }
        });

        that.triggerEvent('onValidateParams');
        that.triggerEvent('onValidateParamsProcess');
        that.triggerEvent('onValidateParamsEnd');
    };

    classProto.renderView = function() {
        var that = this;

        // Structure
        that.nodes.container = cm.node('a', {classes: ['com__menu', 'com__menu--link'], title: that.msg('label'), role: 'button', tabindex: '0'},
            cm.node('div', {classes: 'label'}, that.msg('label')),
            cm.node('div', {classes: that.params.iconClasses}),
            that.nodes.target = cm.node('div', {classes: 'pt__menu'},
                that.nodes.holder = cm.node('ul', {classes: 'pt__menu-dropdown'})
            )
        );

        that.nodes.button = that.nodes.container;
    };

    classProto.renderViewModel = function() {
        var that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Tooltip
        cm.getConstructor(that.params.tooltipConstructor, function(classConstructor) {
            that.components.tooltip = new classConstructor(
                cm.merge(that.params.tooltipParams, {
                    target: that.nodes.container || that.nodes.button,
                    content: that.nodes.target,
                    events: {
                        onShowStart: function() {
                            cm.addClass(that.nodes.button, 'active');
                        },
                        onHideStart: function() {
                            cm.removeClass(that.nodes.button, 'active');
                        },
                    },
                })
            );
        });
    };

    /******** PUBLIC ********/

    classProto.show = function() {
        var that = this;
        that.components.tooltip && that.components.tooltip.show();
        return that;
    };

    classProto.hide = function() {
        var that = this;
        that.components.tooltip && that.components.tooltip.hide();
        return that;
    };

    classProto.getNodes = function(key) {
        var that = this;
        return that.nodes[key] || that.nodes;
    };
});