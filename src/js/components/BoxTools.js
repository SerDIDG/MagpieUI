cm.define('Com.BoxTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__box-tools',
        'maxlength' : 3,
        'inputs' : [
            {'name' : 'top', 'icon' : 'icon svg__indent-top small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'right', 'icon' : 'icon svg__indent-right small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'bottom', 'icon' : 'icon svg__indent-bottom small linked', 'iconPosition' : 'insideRight'},
            {'name' : 'left', 'icon' : 'icon svg__indent-left small linked', 'iconPosition' : 'insideRight'}
        ],
        'langs' : {
            'link' : 'Link',
            'unlink' : 'Unlink'
        }
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.inputs = [];
    that.rawValue = null;
    that.isInputsLinked = false;
    that.lastInput = null;
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.BoxTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        that.linkInputsHandler = that.linkInputs.bind(that);
        that.setValuesHandler = that.setValues.bind(that);
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        _inherit.prototype.set.apply(that, arguments);
        that.setInputs();
        return that;
    };

    classProto.validateValue = function(value){
        var that = this;
        that.rawValue = cm.CSSValuesToArray(value);
        return cm.arrayToCSSValues(that.rawValue);
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__box-tools__content'},
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][0], 0)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][3], 3),
                cm.node('div', {'class' : 'b-link-container'},
                    that.myNodes['link'] = cm.node('div', {'class' : 'b-link', 'title' : that.lang('link')},
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
        that.triggerEvent('onRenderContent');
        cm.addEvent(that.myNodes['link'], 'click', that.linkInputsHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderInput = function(item, i){
        var that = this;
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
        cm.addEvent(item['input'], 'keypress', function(e){
            if(cm.isKeyCode(e.keyCode, 'enter')){
                cm.preventDefault(e);
                that.setValues();
                item['input'].blur();
            }
        });
        cm.allowOnlyDigitInputEvent(item['input'], function(e, value){
            if(that.isInputsLinked){
                that.rawValue = [value, value, value, value];
                that.setInputs();
            }else{
                that.rawValue[item['i']] = value;
            }
            that.selectAction(cm.arrayToCSSValues(that.rawValue), true);
        });
        // Push
        that.inputs.push(item);
        return item['nodes']['container'];
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
                cm.addClass(nodes['inner'], 'less-indent');
                cm.insertFirst(nodes['icon'], nodes['inner']);
                break;
            case 'insideRight':
                cm.addClass(nodes['inner'], 'less-indent');
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
            item['input'].value = that.rawValue[item['i']];
        });
        return that;
    };

    classProto.setValues = function(triggerEvents){
        var that = this;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        that.set(cm.arrayToCSSValues(that.rawValue), triggerEvents);
        return that;
    };

    classProto.linkInputs = function(){
        var that = this;
        if(!that.isInputsLinked){
            that.isInputsLinked = true;
            cm.addClass(that.myNodes['link'], 'active');
            that.myNodes['link'].title = that.lang('unlink');
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
            cm.removeClass(that.myNodes['link'], 'active');
            that.myNodes['link'].title = that.lang('link');
        }
        return that;
    };
});