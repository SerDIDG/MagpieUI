cm.define('Com.ScaleTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__scale-tools',
        'defaultValue' : 'original',
        'options' : [
            {'name' : 'original', 'icon' : 'svg__scale-original'},
            {'name' : 'contain', 'icon' : 'svg__scale-contain'},
            {'name' : 'cover', 'icon' : 'svg__scale-cover'},
            {'name' : '100% 100%', 'icon' : 'svg__scale-fill'}
        ]
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.options = {};
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.ScaleTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.set = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.set.apply(that, arguments);
        // Set inputs
        that.setOption();
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__scale-tools__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.forEach(that.params['options'], function(item){
            that.renderOption(item);
        });
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.renderOption = function(item){
        var that = this;
        // Config
        item = cm.merge({
            'iconType' : 'icon',
            'icon' : '',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('div', {'class' : 'option__item'},
            item['nodes']['icon'] = cm.node('div', {'class' : [item['iconType'], item['icon']].join(' ')})
        );
        cm.appendChild(item['nodes']['container'], that.myNodes['inner']);
        // Events
        cm.addEvent(item['nodes']['container'], 'click', function(){
            that.set(item['name']);
        });
        // Push
        that.options[item['name']] = item;
        return that;
    };

    classProto.setOption = function(){
        var that = this,
            item;
        if(that.options[that.previousValue]){
            item = that.options[that.previousValue];
            cm.removeClass(item['nodes']['container'], 'is-active');
        }
        if(that.options[that.value]){
            item = that.options[that.value];
            cm.addClass(item['nodes']['container'], 'is-active');
        }
    };
});