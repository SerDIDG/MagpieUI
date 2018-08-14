cm.define('Com.MultipleAutocomplete', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-autocomplete',
        'sortable' : false,
        'showToolbar' : false,
        'showControls' : true,
        'focusInput' : true,
        'inputConstructor' : 'Com.Autocomplete'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.MultipleInput.apply(that, arguments);
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('multi-autocomplete', {
    'node' : cm.node('div'),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.MultipleAutocomplete'
});