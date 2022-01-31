cm.define('Com.AutocompleteField', {
    'extend' : 'Com.AbstractInput',
    'events': [
        'onFocus',
        'onBlur',
    ],
    'params' : {
        'controllerEvents' : true,
        'type': 'text',
        'autocomplete': {
            'constructor' : 'Com.Autocomplete',
            'constructorParams' : {
                'minLength' : 1,
                'direction' : 'start'
            }
        }
    }
},
function(){
    Com.AbstractInput.apply(this, arguments);
});

cm.getConstructor('Com.AutocompleteField', function(classConstructor, className, classProto, classInherit){
    classProto.construct = function(){
        var that = this;
        that.options = [];

        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.validateParams = function(){
        var that = this;
        classInherit.prototype.validateParams.apply(that, arguments);

        // Collect Options
        var options = that.params['node'].options;
        cm.forEach(options, function(node){
            that.options.push({
                'value': node.value,
                'text': node.innerHTML
            });
        });
    };

    classProto.validateParamsValue = function(){
        var that = this,
            value;
        if(cm.isNode(that.params['node'])){
            value = cm.getSelectValue(that.params['node']);
            that.params['value'] = !cm.isEmpty(value) ?  value : that.params['value'];
        }
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
    };

    /*** VIEW MODEL ***/

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__input'},
            nodes['input'] = cm.node('input', {'type' : that.params['type']})
        );
        // Attributes
        if(!cm.isEmpty(that.params['placeholder'])){
            nodes['input'].placeholder = that.params['placeholder'];
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Push
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init Autocomplete
        cm.getConstructor(that.params.autocomplete.constructor, function(classConstructor){
            that.components.autocomplete = new classConstructor(
                cm.merge(that.params.autocomplete.constructorParams, {
                    node: that.nodes.content.input,
                    data: that.options,
                    callbacks: that.renderAutocompleteCallbacks.bind(that),
                    events: that.renderAutocompleteEvents.bind(that)
                })
            );
        })
    };

    /*** AUTOCOMPLETE ***/

    classProto.renderAutocompleteCallbacks = function(){
        var that = this;
        return {};
    };

    classProto.renderAutocompleteEvents = function(){
        var that = this;
        return {
            onChange: function(Autocomplete, value){
                that.set(value, true);
            },
            onFocus: function(){
                that.triggerEvent('onFocus')
            },
            onBlur: function(){
                that.triggerEvent('onBlur')
            }
        };
    };

    /* *** DATA VALUE *** */

    classProto.setData = function(){
        var that = this,
            value = that.value,
            item = that.getOption(that.value);
        if(item){
            value = !cm.isEmpty(item['text']) ? item['text'] : item['value'];
        }
        that.nodes['content']['input'].value = value;
        return that;
    };

    classProto.getOption = function(value){
        var that = this,
            item;
        cm.forEach(that.options, function(option){
            if(option['value'] === value){
                item = option;
            }
        });
        return item;
    };
});

Com.FormFields.add('autocomplete-field', {
    'node' : cm.node('select'),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.AutocompleteField'
});
