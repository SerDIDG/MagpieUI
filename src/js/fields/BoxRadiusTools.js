cm.define('Com.BoxRadiusTools', {
    extend: 'Com.BoxTools',
    params: {
        className: 'com__box-tools com__box-tools--radius',
        inputs: [
            {
                name: 'topleft',
                icon: 'icon svg__radius-topleft small linked',
                iconPosition: 'outsideLeft'
            },
            {
                name: 'topright',
                icon: 'icon svg__radius-topright small linked',
                iconPosition: 'outsideRight'
            },
            {
                name: 'bottomright',
                icon: 'icon svg__radius-bottomright small linked',
                iconPosition: 'outsideRight'
            },
            {
                name: 'bottomleft',
                icon: 'icon svg__radius-bottomleft small linked',
                iconPosition: 'outsideLeft'
            },
        ],
    },
},
function() {
    Com.BoxTools.apply(this, arguments);
});

cm.getConstructor('Com.BoxRadiusTools', function(classConstructor, className, classProto,  classInherit) {
    classProto.renderContent = function() {
        const that = this;
        const nodes = {};

        that.nodes.content = nodes;
        that.triggerEvent('onRenderContentStart');

        // Structure
        nodes.container = cm.node('div', {classes: 'com__box-tools__content'},
            cm.node('div', {classes: 'b-line'},
                that.renderInput(that.params.inputs[0], 0),
                that.renderInput(that.params.inputs[1], 1)
            ),
            cm.node('div', {classes: 'b-line'},
                that.renderInput(that.params.inputs[3], 3),
                that.renderInput(that.params.inputs[2], 2)
            ),
            cm.node('div', {classes: 'b-line'},
                that.renderLinkButton(),
            )
        );

        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');

        // Push
        return nodes.container;
    };
});