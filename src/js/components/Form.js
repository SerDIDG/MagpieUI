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

    var renderField = function(type, params){
        var field;
        // Merge params
        params = cm.merge({
            'name' : '',
            'label' : '',
            'options' : [],
            'container' : that.nodes['form']
        }, params);
        // Render
        if(field = Com.FormFields.get(type)){
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

    that.add = function(type, params){
        renderField(type, params);
        return that;
    };

    init();
});

/* ******* COMPONENT: FORM FIELD ******* */

Com.FormFields = (function(){
    var stack = {};

    return {
        'add' : function(type, params){
            stack[type] = cm.merge({
                'node' : cm.node('div'),
                'type' : type
            }, params);
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
        'component' : false,
        'componentParams' : {}
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
        if(that.params['component']){
            cm.getConstructor(that.params['component'], function(classConstructor){
                that.params['constructor'] = classConstructor;
            });
        }
        that.params['componentParams']['node'] = that.params['node'];
        that.params['componentParams']['name'] = that.params['name'];
        that.params['componentParams']['options'] = that.params['options'];
    };

    var render = function(){
        // Render structure
        that.nodes = that.callbacks.render.call(that) || {};
        // Append
        that.params['container'].appendChild(that.nodes['container']);
        // Construct
        that.callbacks.construct.call(that);
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.construct = function(){
        that.component = that.callbacks.component.call(that, that.params['componentParams']);
    };

    that.callbacks.component = function(params){
        if(that.params['component']){
            return new that.params['constructor'](params);
        }
    };

    that.callbacks.render = function(){
        var nodes = {};
        nodes['container'] = cm.node('dl',
            nodes['label'] = cm.node('dt', that.params['label']),
            nodes['value'] = cm.node('dd', that.params['node'])
        );
        that.params['node'].setAttribute('name', that.params['name']);
        return nodes;
    };

    that.callbacks.set = function(value){
        that.component.set(value);
        return value;
    };

    that.callbacks.get = function(){
        return that.component.get();
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
            return that.params['node'].value;
        }
    }
});

Com.FormFields.add('textarea', {
    'node' : cm.node('textarea'),
    'callbacks' : {
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'].value;
        }
    }
});

Com.FormFields.add('select', {
    'node' : cm.node('select'),
    'callbacks' : {
        'component' : function(){
            var that = this,
                nodes,
                items = [];
            cm.forEach(that.params['options'], function(item){
                nodes = {};
                nodes['container'] = cm.node('option', {'value' : item['value']}, item['text']);
                that.params['node'].appendChild(nodes['container']);
                items.push(nodes);
            });
            return items;
        },
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'].value;
        }
    }
});

Com.FormFields.add('radio', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'component' : function(){
            var that = this,
                nodes,
                items = [];
            cm.forEach(that.params['options'], function(item){
                nodes = {};
                nodes['container'] = cm.node('label',
                    nodes['input'] = cm.node('input', {'type' : 'radio', 'name' : that.params['name'], 'value' : item['value']}),
                    nodes['label'] = cm.node('span', {'class' : 'label'}, item['text'])
                );
                that.params['node'].appendChild(nodes['container']);
                items.push(nodes);
            });
            return items;
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
        'component' : function(){
            var that = this,
                nodes,
                items = [];
            cm.forEach(that.params['options'], function(item){
                nodes = {};
                nodes['container'] = cm.node('label',
                    nodes['input'] = cm.node('input', {'type' : 'checkbox', 'name' : that.params['name'], 'value' : item['value']}),
                    nodes['label'] = cm.node('span', {'class' : 'label'}, item['text'])
                );
                that.params['node'].appendChild(nodes['container']);
                items.push(nodes);
            });
            return items;
        },
        'set' : function(value){
            var that = this;
            that.params['node'].value = value;
            return value;
        },
        'get' : function(){
            var that = this;
            return that.params['node'].value;
        }
    }
});