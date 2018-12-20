cm.define('Com.TintRange', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__range',
        'theme' : 'theme--arrows',
        'min' : 360,
        'max' : 0,
        'value' : 360
    }
},
function(params){
    var that = this;
    Com.AbstractRange.apply(that, arguments);
});

cm.getConstructor('Com.TintRange', function(classConstructor, className, classProto){
    classProto.renderRangeContent = function(){
        var that = this,
            nodes = {};
        that.nodes['rangeContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__tint-range__content'});
        // Export
        return nodes['container'];
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('tint-range', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.TintRange'
});