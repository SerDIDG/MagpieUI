cm.define('Com.TintRange', {
    extend: 'Com.AbstractRange',
    params: {
        className: 'com__range',
        theme: 'theme--arrows',
        min: 360,
        max: 0,
        value: 360,
    },
},
function() {
    Com.AbstractRange.apply(this, arguments);
});

cm.getConstructor('Com.TintRange', function(classConstructor, className, classProto) {
    classProto.renderRangeContent = function() {
        const that = this;

        // Structure
        const nodes = that.nodes.rangeContent = {};
        nodes.container = cm.node('div', {classes: 'com__tint-range__content'});

        // Export
        return nodes.container;
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('tint-range', {
    node: cm.node('input', {type: 'text'}),
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.TintRange'
});