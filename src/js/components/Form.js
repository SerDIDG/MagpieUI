cm.define('Com.Form', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'renderStructure' : true
    }
},
function(params){
    var that = this;

    that.fields = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('div', {'class' : 'com__form'},
                that.nodes['form'] = cm.node('form', {'class' : 'form'})
            );
            that.appendStructure(that.nodes['container']);
            cm.remove(that.params['node']);
        }
    };

    var renderField = function(params){
        var field;
        // Merge params
        params = cm.merge({
            'type' : null,
            'name' : '',
            'label' : '',
            'fields' : [],
            'container' : that.nodes['form']
        }, params);
        // Render
        if(field = Com.FormFields.get(params['type'])){
            cm.getConstructor('Com.FormField', function(classConstructor){
                params = cm.merge(field, params);
                that.fields[params['name']] = new classConstructor(params);
            });
        }
    };

    /* ******* PUBLIC ******* */

    that.clear = function(){
        cm.clearNode(that.nodes['form']);
        return that;
    };

    that.add = function(item){
        renderField(item);
        return that;
    };

    init();
});

/* ******* COMPONENT: FORM FIELD ******* */

Com.FormFields = (function(){
    var stack = {};

    return {
        'add' : function(type, item){
            stack[type] = cm.merge({
                'node' : cm.node('div'),
                'type' : type
            }, item);
        },
        'get' : function(type){
            return stack[type]? cm.clone(stack[type], true) : null;
        }
    };
})();

cm.define('Com.FormField', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack',
        'Callbacks'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : cm.node('div'),
        'name' : '',
        'type' : false,
        'label' : '',
        'options' : [],
        'isComponent' : false
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.component = null;
    that.value = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(that.params['isComponent']){
            cm.getConstructor(that.params['type'], function(classConstructor){
                that.params['constructor'] = classConstructor;
            });
        }
    };

    var render = function(){
        // Render structure
        that.nodes = that.callbacks.render.apply(that) || {};
        // Append
        that.params['container'].appendChild(that.nodes['container']);
        // Construct
        that.callbacks.construct.apply(that);
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.construct = function(){
        if(that.params['isComponent'] && that.params['constructor']){
            that.component = that.callbacks.component.apply(that, that.params[that.params['type']]);
        }else{
            that.callbacks.component.apply(that);
        }
    };

    that.callbacks.component = function(params){
        return new that.params['constructor'](
            cm.merge(params, {
                'node' : that.params['node'],
                'name' : that.params['name']
            })
        );
    };

    that.callbacks.render = function(){
        var nodes = {};
        nodes['container'] = cm.node('dl',
            nodes['label'] = cm.node('dt', that.params['label']),
            nodes['value'] = cm.node('dd', that.params['node'])
        );
        return nodes;
    };

    that.callbacks.set = function(value){
        return value;
    };

    that.callbacks.get = function(){
        return that.value;
    };

    /* ******* PUBLIC ******* */

    that.set = function(value){
        that.value = that.callbacks.set.apply(that, value);
        return that;
    };

    that.get = function(){
        that.value = that.callbacks.get.apply(that);
        return that.value;
    };

    init();
});

/* ******* COMPONENT: FORM FIELDS ******* */

Com.FormFields.add('input', {
    'node' : cm.node('input', {'type' : 'text'}),
    'callbacks' : {
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'];
        }
    }
});

Com.FormFields.add('text', {
    'node' : cm.node('textarea'),
    'callbacks' : {
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'];
        }
    }
});

Com.FormFields.add('radio', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'construct' : function(){
            var that = this;
            cm.forEach(that.params['options'], function(item){
                that.params['node'].appendChild(
                    cm.node('label',
                        cm.node('input', {'type' : 'radio', 'name' : that.params['name'], 'value' : item['value']}),
                        cm.node('span', {'class' : 'label'}, item['text'])
                    )
                );
            });
        },
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'];
        }
    }
});

Com.FormFields.add('check', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'construct' : function(){
            var that = this;
            cm.forEach(that.params['options'], function(item){
                that.params['node'].appendChild(
                    cm.node('label',
                        cm.node('input', {'type' : 'checkbox', 'name' : that.params['name'], 'value' : item['value']}),
                        cm.node('span', {'class' : 'label'}, item['text'])
                    )
                );
            });
        },
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'];
        }
    }
});