cm.define('Com.TwoSideMultiSelect', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'className' : 'com__two-side-multi-select',
        'setHiddenInput' : true,
        'defaultValue' : [],
        'options' : [],
        'selectConstructor' : 'Com.Select',
        'selectParams' : {
            'node' : cm.node('select', {'multiple' : true}),
            'multiple' : true,
            'className' : 'is-max'
        }
    },
    'strings' : {
        'add' : '>>',
        'remove' : '<<',
        'addTitle' : 'Add',
        'removeTitle' : 'Remove'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.TwoSideMultiSelect', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that.value = [];
        that.options = {};
        // Binds
        that.keyPressHandler = that.keyPressHelper.bind(that);
        that.moveToLeftHandler = that.moveToLeft.bind(that);
        that.moveToRightHandler = that.moveToRight.bind(that);
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

    classProto.onSetEvents = function(){
        var that = this;
        cm.addEvent(window, 'keypress', that.keyPressHandler);
    };

    classProto.onUnsetEvents = function(){
        var that = this;
        cm.removeEvent(window, 'keypress', that.keyPressHandler);
    };

    /*** VIEW MODEL ***/

    classProto.renderHiddenContent = function(){
        var that = this,
            nodes = {};
        that.nodes['hiddenContent'] = nodes;
        // Structure
        nodes['container'] = nodes['input'] = cm.node('select', {'class' : 'display-none', 'multiple' : true});
        // Export
        return nodes['container'];
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__two-side__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'},
                nodes['firstColumn'] = cm.node('div', {'class' : 'column column--first'}),
                nodes['controls'] = cm.node('div', {'class' : 'controls'},
                    nodes['moveToRight'] = cm.node('button', {'class' : 'button button-primary is-box', 'title' : that.lang('addTitle')}, that.lang('add')),
                    nodes['moveToLeft'] = cm.node('button', {'class' : 'button button-primary is-box', 'title' : that.lang('removeTitle')}, that.lang('remove'))
                ),
                nodes['secondColumn'] = cm.node('div', {'class' : 'column column--second'})
            )
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(nodes['moveToRight'], 'click', that.moveToRightHandler);
        cm.addEvent(nodes['moveToLeft'], 'click', that.moveToLeftHandler);
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Render selects
        cm.getConstructor(that.params['selectConstructor'], function(classConstructor){
            that.components['firstSelect'] = new classConstructor(
                cm.merge(that.params['selectParams'], {
                    'container' : that.nodes['content']['firstColumn']
                })
            );
            that.components['secondSelect'] = new classConstructor(
                cm.merge(that.params['selectParams'], {
                    'container' : that.nodes['content']['secondColumn']
                })
            );
        });
        // Collect and render options
        that.collectOptions();
        // Render data options
        cm.forEach(that.params['options'], function(item){
            that.renderOption(item);
        });
    };

    /*** OPTIONS ***/

    classProto.collectOptions = function(){
        var that = this;
        cm.forEach(that.params['node'].options, function(item){
            that.renderOption({
                'value' : item.value,
                'text' : item.innerHTML
            });
        });
    };

    classProto.renderOption = function(item){
        var that = this;
        // Validate
        item = cm.merge({
            'value' : null,
            'text' : null
        }, item);
        item['value'] = !cm.isUndefined(item['value'])? item['value'] : item['text'];
        // Render hidden option
        item['option'] = cm.node('option', {'value' : item['value'], 'innerHTML' : item['text']});
        that.nodes['hidden'].appendChild(item['option']);
        // Add options
        that.components['firstSelect'].addOption(item['value'], item['text']);
        that.options[item['value']] = item;
    };

    /*** MOVE ***/

    classProto.moveToLeft = function(){
        var that = this,
            selected = that.components['secondSelect'].get();
        if(!cm.isEmpty(selected)){
            that.components['secondSelect'].deselectAll();
            selected = cm.extract(that.value, selected);
            that.set(selected, true);
        }
    };

    classProto.moveToRight = function(){
        var that = this,
            selected = that.components['firstSelect'].get();
        if(!cm.isEmpty(selected)){
            that.components['firstSelect'].deselectAll();
            selected = cm.extend(that.value, selected);
            that.set(selected, true);
        }
    };

    classProto.moveOptionToLeft = function(item){
        var that = this;
        if(item['selected']){
            item['selected'] = false;
            that.components['secondSelect'].removeOption(item['value']);
            that.components['firstSelect'].showOption(item['value']);
        }
    };

    classProto.moveOptionToRight = function(item){
        var that = this;
        if(!item['selected']){
            item['selected'] = true;
            that.components['secondSelect'].addOption(item['value'], item['text']);
            that.components['firstSelect'].hideOption(item['value']);
        }
    };

    /*** EVENTS ***/

    classProto.keyPressHelper = function(e){
        var that = this,
            target = cm.getElementAbove(e);
        cm.handleKey(e, 'enter', function(e){
            if(cm.isParent(that.nodes['content']['firstColumn'], target, true)){
                cm.preventDefault(e);
                that.moveToRight();
            }
            if(cm.isParent(that.nodes['content']['secondColumn'], target, true)){
                cm.preventDefault(e);
                that.moveToLeft();
            }
        });
    };

    /*** VALUE ***/

    classProto.saveHiddenValue = function(value){
        var that = this,
            isInArray,
            isSelected;
        cm.forEach(that.options, function(item){
            if(!cm.isEmpty(value)){
                isInArray = cm.isArray(value) && cm.inArray(value, item['value']);
                isSelected = isInArray || item['value'] === value;
                item['option'].selected = isSelected;
            }else{
                item['option'].selected = false;
            }
        });
    };

    classProto.setData = function(value){
        var that = this,
            isInArray,
            isSelected;
        cm.forEach(that.options, function(item){
            if(!cm.isEmpty(value)){
                isInArray = cm.isArray(value) && cm.inArray(value, item['value']);
                isSelected = isInArray || item['value'] === value;
                if(isSelected){
                    that.moveOptionToRight(item);
                }else{
                    that.moveOptionToLeft(item);
                }
            }else{
                that.moveOptionToLeft(item);
            }
        });
    };
});