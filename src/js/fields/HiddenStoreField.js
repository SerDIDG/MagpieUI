cm.define('Com.HiddenStoreField', {
    'extend' : 'Com.AbstractInputContainer',
    'params' : {
        'constructor' : 'Com.AbstractInput',
        'storeRaw' : false,
        'triggerName' : null
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInputContainer.apply(that, arguments);
});

cm.getConstructor('Com.HiddenStoreField', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        // Binds
        that.processDataHandler = that.processData.bind(that);
    };

    classProto.onRenderController = function(){
        var that = this;
        // Get trigger field
        var field = that.components['form'].getField(that.params['triggerName']);
        if(field){
            that.components['trigger'] = field['controller'];
            that.components['trigger'].addEvent('onChange', that.processDataHandler);
            that.components['trigger'].addEvent('onReset', that.resetHandler);
        }
    };

    classProto.processData = function(){
        var that = this,
            data = that.params['storeRaw'] ? that.components['trigger'].getRaw() : that.components['trigger'].get();
        that.set(data);
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('hidden-store', {
    'node' : cm.node('input', {'type' : 'hidden'}),
    'visible' : false,
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.HiddenStoreField'
});