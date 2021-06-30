cm.define('Com.Check', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'type' : 'checkbox',
        'multiple' : false,
        'inline' : false
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.Check', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that.inputs = [];
        that.hidden = [];
        // Bind context to methods
        that.setValueHandler = that.setValue.bind(that);
    };

    classProto.onValidateParamsProcess = function(){
        var that = this;
        if(!cm.isEmpty(that.params['options'])){
            that.params['multiple'] = that.params['type'] === 'checkbox';
            // Convert option values
            cm.forEach(that.params['options'], function(item){
                if(!cm.isEmpty(item['value']) && (item['checked'] || item['selected'])){
                    if(cm.isEmpty(that.params['value'])){
                        that.params['value'] = [];
                    }else if(cm.isString(that.params['value']) || cm.isNumber(that.params['value'])){
                        that.params['value'] = [that.params['value']];
                    }
                    cm.arrayAdd(that.params['value'], item['value']);
                }
            });
        }
        // Checked parameter behavior override
        if(that.params['checked'] && cm.isEmpty(that.params['value'])){
            if(!that.params['multiple']){
                that.params['value'] = true;
            }
        }
    };

    /*** VIEW MODEL ***/

    classProto.renderHiddenContent = function(){
        var that = this,
            nodes = {},
            inputContainer;
        that.nodes['hiddenContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'display-none'});
        // Render inputs
        if(!cm.isEmpty(that.params['options'])){
            cm.forEach(that.params['options'], function(option){
                inputContainer = that.renderHiddenInput(option);
                cm.appendChild(inputContainer, nodes['container']);
            });
        }else{
            inputContainer = that.renderHiddenInput();
            cm.appendChild(inputContainer, nodes['container']);
        }
        // Export
        return nodes['container'];
    };

    classProto.renderHiddenInput = function(item){
        var that = this,
            nodes = {};
        item = cm.merge({
            'nodes' : nodes,
            'value' : null
        }, item);
        // Structure
        nodes['container'] = nodes['input'] = cm.node('input', {'type' : that.params['type']});
        item['input'] = nodes['input'];
        // Attributes
        if(!cm.isEmpty(item['value'])){
            item['input'].value = item['value'];
        }
        if(!cm.isEmpty(that.params['name'])){
            item['input'].setAttribute('name', that.params['name']);
        }
        // Push
        that.hidden.push(item);
        return nodes['container'];
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {},
            inputContainer;
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__check-line'});
        if(that.params['inline']){
            cm.addClass(nodes['container'], 'is-line');
        }else{
            cm.addClass(nodes['container'], 'is-box');
        }
        // Render inputs
        that.triggerEvent('onRenderContentProcess');
        if(!cm.isEmpty(that.params['options'])){
            cm.forEach(that.params['options'], function(option){
                inputContainer = that.renderInput(option);
                cm.appendChild(inputContainer, nodes['container']);
            });
        }else{
            inputContainer = that.renderInput({
                'text' : that.params['placeholder'],
                'value' : that.params['value']
            });
            cm.appendChild(inputContainer, nodes['container']);
        }
        that.triggerEvent('onRenderContentEnd');
        // Push
        return nodes['container'];
    };

    classProto.renderInput = function(item){
        var that = this,
            nodes = {};
        item = cm.merge({
            'nodes' : nodes,
            'text' : '',
            'value' : null
        }, item);
        // Structure
        nodes['container'] = cm.node('label',
            nodes['input'] = cm.node('input', {'type' : that.params['type']}),
            nodes['label'] = cm.node('span', {'class' : 'label', 'innerHTML' : item['text']})
        );
        item['input'] = nodes['input'];
        // Attributes
        if(!cm.isEmpty(item['value'])){
            nodes['input'].value = item['value'];
        }
        // Events
        cm.addEvent(item['input'], 'click', function(e){
            that.setValue(item, true);
        });
        // Push
        that.inputs.push(item);
        return nodes['container'];
    };

    /* *** DATA VALUE *** */

    classProto.setHiddenAttributes = function(){
        var that = this;
    };

    classProto.validateValue = function(value){
        var that = this;
        return value;
    };

    classProto.setValue = function(item, triggerEvents){
        var that = this,
            value = null;
        triggerEvents = cm.isUndefined(triggerEvents)? true : triggerEvents;
        // Get value
        if(!cm.isEmpty(that.params['options'])){
            if(that.params['multiple']){
                value = [];
                cm.forEach(that.inputs, function(item){
                    item['input'].checked && value.push(item['value']);
                });
            }else{
                value = item['value'];
            }
        }else{
            if(item['input'].checked){
                value = !cm.isEmpty(item['value']) ? item['value'] : true;
            }else{
                value = false;
            }
        }
        that.set(value, triggerEvents);
        return that;
    };

    classProto.saveHiddenValue = function(value){
        var that = this;
        if(!cm.isEmpty(that.params['options'])){
            if(that.params['multiple']){
                cm.forEach(that.hidden, function(item){
                    item['input'].checked = cm.inArray(value, item['value']);
                });
            }else{
                cm.forEach(that.hidden, function(item){
                    item['input'].checked = value === item['value'];
                });
            }
        }else{
            that.hidden[0]['input'].checked = !(cm.isEmpty(value) || value === 0 || value === '0' || value === false);
        }
    };

    classProto.setData = function(value){
        var that = this;
        if(!cm.isEmpty(that.params['options'])){
            if(that.params['multiple']){
                cm.forEach(that.inputs, function(item){
                    item['input'].checked = cm.inArray(value, item['value']);
                });
            }else{
                cm.forEach(that.inputs, function(item){
                    item['input'].checked = value === item['value'];
                });
            }
        }else{
            that.inputs[0]['input'].checked = !(cm.isEmpty(value) || value === 0 || value === '0' || value === false);
        }
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('checkbox', {
    'node' : cm.node('div', {'class' : 'pt__check-line'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Check',
    'constructorParams' : {
        'type' : 'checkbox'
    }
});

Com.FormFields.add('radio', {
    'node' : cm.node('div', {'class' : 'pt__check-line'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Check',
    'constructorParams' : {
        'type' : 'radio',
        'inline' : true
    }
});

Com.FormFields.add('check', {
    'node' : cm.node('div', {'class' : 'pt__check-line'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Check',
    'constructorParams' : {
        'type' : 'checkbox',
        'inline' : true
    }
});
