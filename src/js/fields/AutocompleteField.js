cm.define('Com.AutocompleteField', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'type' : 'text',
        'autocompleteConstructor' : 'Com.Autocomplete',
        'autocompleteParams' : {
            'minLength' : 1,
            'direction' : 'start'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.AutocompleteField', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        that.options = [];
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.validateParams.apply(that, arguments);
        // Collect Options
        var options = that.params['node'].options;
        cm.forEach(options, function(node){
            that.options.push({
                'value' : node.value,
                'text' : node.innerHTML
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
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Init Autocomplete
        cm.getConstructor(that.params['autocompleteConstructor'], function(classConstructor){
            that.components['autocomplete'] = new classConstructor(
                cm.merge(that.params['autocompleteParams'], {
                    'node' : that.nodes['content']['input'],
                    'data' : that.options
                })
            );
            that.components['autocomplete'].addEvent('onChange', function(autocomplete, value){
                that.set(value, true);
            })
        })
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