cm.define('Com.FieldContent', {
    extend: 'Com.AbstractInput',
    params: {
        controllerEvents: true,
        renderStructureContent: false,
        renderHiddenContent: false,
        setHiddenInput: false,
    },
},
function() {
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.FieldContent', function(classConstructor, className, classProto, classInherit) {
    classProto.setData = function() {
        var that = this,
            node = that.value;
        cm.clearNode(that.nodes.contentContainer);
        if (!cm.isNode(node)) {
            node = cm.node('div', {innerHTML: node});
        }
        cm.appendChild(node, that.nodes.contentContainer);
        return that;
    };

    classProto.setAttributes = function() {
        var that = this;

        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);

        if (!cm.isEmpty(that.params.fieldName)) {
            that.nodes.container.setAttribute('id', that.params.fieldName);
        }
    };
});

/****** FORM FIELD COMPONENT *******/

Com.FormFields.add('content', {
    node: cm.node('div'),
    value: '',
    defaultValue: '',
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.FieldContent',
});

Com.FormFields.add('title', {
    node: cm.node('div', {classes: 'pt__field-title'}),
    value: '',
    defaultValue: '',
    inputValueType: 'unset',
    renderStructureField: false,
    renderStructureContent: false,
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.FieldContent',
    constructorParams: {
        embedStructure: 'append',
    },
});

Com.FormFields.add('node', {
    node: cm.node('div'),
    value: '',
    defaultValue: '',
    inputValueType: 'unset',
    renderStructureField: false,
    renderStructureContent: false,
    fieldConstructor: 'Com.AbstractFormField',
    constructor: 'Com.FieldContent',
    constructorParams: {
        embedStructure: 'append',
    },
});

