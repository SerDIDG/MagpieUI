cm.define('Com.BoxTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'className' : 'com__box-tools',
        'maxlength' : 5,
        'units' : 'px',
        'allowNegative' : false,
        'allowFloat' : false,
        'inputs' : [
            {'name' : 'top', 'icon' : 'icon svg__indent-top small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'right', 'icon' : 'icon svg__indent-right small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'bottom', 'icon' : 'icon svg__indent-bottom small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'left', 'icon' : 'icon svg__indent-left small linked', 'iconPosition' : 'insideRight'}
        ]
    },
    'strings' : {
        'link' : 'Link',
        'unlink' : 'Unlink'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.BoxTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that.inputs = [];
        that.rawValue = null;
        that.isInputsLinked = false;
        that.lastInput = null;
        // Bind context to methods
        that.linkInputsHandler = that.linkInputs.bind(that);
        that.setValuesHandler = that.setValues.bind(that);
        return that;
    };

    classProto.onEnable = function(){
        var that = this;
        cm.forEach(that.inputs, function(item){
            cm.removeClass(item['nodes']['inner'], 'disabled');
            item['input'].disabled = false;
        });
    };

    classProto.onDisable = function(){
        var that = this;
        cm.forEach(that.inputs, function(item){
            cm.addClass(item['nodes']['inner'], 'disabled');
            item['input'].disabled = true;
        });
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__box-tools__content'},
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][0], 0)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][3], 3),
                cm.node('div', {'class' : 'b-link-container'},
                    nodes['link'] = cm.node('div', {'class' : 'b-link', 'title' : that.lang('link')},
                        cm.node('div', {'class' : 'icon'})
                    )
                ),
                that.renderInput(that.params['inputs'][1], 1)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][2], 2)
            )
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['link'], 'click', that.linkInputsHandler);
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
    };

    classProto.renderInput = function(item, i){
        var that = this,
            params = {
                'allowNegative' : that.params['allowNegative'],
                'allowFloat' : that.params['allowFloat']
            };
        // Validate
        item = cm.merge({
            'i' : i,
            'icon' : 'small',
            'iconPosition' : 'leftInside',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes'] = that.renderInputContainer(item);
        item['input'] = item['nodes']['input'];
        // Attributes
        if(that.params['maxlength']){
            item['input'].setAttribute('maxlength', that.params['maxlength']);
        }
        // Events
        cm.addEvent(item['nodes']['icon'], 'click', function(e){
            cm.preventDefault(e);
            item['input'].setSelectionRange(0, item['input'].value.length);
            item['input'].focus();
        });
        cm.addEvent(item['input'], 'focus', function(){
            that.lastInput = item;
        });
        cm.addEvent(item['input'], 'blur', that.setValuesHandler);
        // Keypress events
        cm.addEvent(item['input'], 'keypress', function(e){
            if(e.code === 'Enter'){
                cm.preventDefault(e);
                that.setValues();
                item['input'].blur();
            }
        });
        // Input events
        cm.allowOnlyNumbersInputEvent(item['input'], function(e, value){
            that.inputOnInputEvent(e, value, item);
        }, params);
        // Push
        that.inputs.push(item);
        return item['nodes']['container'];
    };

    classProto.inputOnInputEvent = function(e, value, item){
        var that = this;
        if(that.isInputsLinked){
            that.tempRawValue = [value, value, value, value];
            that.setInputs();
        }else{
            that.tempRawValue[item['i']] = value;
        }
        that.selectAction(cm.arrayToCSSValues(that.tempRawValue, that.params['units']), true);
        return that;
    };

    classProto.renderInputContainer = function(item){
        var that = this,
            nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'b-container'},
            nodes['inner'] = cm.node('div', {'class' : 'pt__input'},
                nodes['input'] = cm.node('input', {'type' : 'text'})
            )
        );
        if(!cm.isEmpty(item['title'])){
            nodes['inner'].setAttribute('title', item['title']);
        }
        nodes['icon'] = cm.node('div', {'class' : item['icon']});
        switch(item['iconPosition']){
            case 'insideLeft':
                cm.addClass(nodes['inner'], 'is-less-indent');
                cm.insertFirst(nodes['icon'], nodes['inner']);
                break;
            case 'insideRight':
                cm.addClass(nodes['inner'], 'is-less-indent');
                cm.insertLast(nodes['icon'], nodes['inner']);
                break;
            case 'outsideLeft':
                cm.addClass(nodes['inner'], 'is-icon-outside');
                cm.insertFirst(nodes['icon'], nodes['inner']);
                break;
            case 'outsideRight':
                cm.addClass(nodes['inner'], 'is-icon-outside');
                cm.insertLast(nodes['icon'], nodes['inner']);
                break;
        }
        return nodes;
    };

    classProto.setInputs = function(){
        var that = this;
        cm.forEach(that.inputs, function(item){
            item['input'].value = that.tempRawValue[item['i']];
        });
        return that;
    };

    classProto.setValues = function(triggerEvents){
        var that = this;
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        that.set(cm.arrayToCSSValues(that.tempRawValue, that.params['units']), triggerEvents);
        return that;
    };

    classProto.linkInputs = function(){
        var that = this;
        if(!that.disabled){
            if(!that.isInputsLinked){
                that.isInputsLinked = true;
                cm.addClass(that.nodes['content']['link'], 'active');
                that.nodes['content']['link'].title = that.lang('unlink');
                if(that.lastInput){
                    that.set(that.lastInput['input'].value);
                }else{
                    var value = 0;
                    cm.forEach(that.inputs, function(item){
                        value = Math.max(value, parseInt(item['input'].value));
                    });
                    that.set(value);
                }
            }else{
                that.isInputsLinked = false;
                cm.removeClass(that.nodes['content']['link'], 'active');
                that.nodes['content']['link'].title = that.lang('link');
            }
        }
        return that;
    };

    /*** DATA ***/

    classProto.setData = function(){
        var that = this;
        that.setInputs();
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        return cm.arrayToCSSValues(cm.CSSValuesToArray(value), that.params['units']);
    };

    classProto.saveRawValue = function(value){
        var that = this;
        that.tempRawValue = cm.CSSValuesToArray(value);
    };
});