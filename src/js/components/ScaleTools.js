cm.define('Com.ScaleTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__scale-tools',
        'defaultValue' : 'original',
        'fieldStyle' : 'row',                   // row | block
        'options' : [
            {'name' : 'original', 'icon' : 'svg__scale-original'},
            {'name' : 'contain', 'icon' : 'svg__scale-contain'},
            {'name' : 'cover', 'icon' : 'svg__scale-cover'},
            {'name' : '100% 100%', 'icon' : 'svg__scale-fill'}
        ],
        'langs' : {
            'original' : 'Original',
            'contain' : 'Contain',
            'cover' : 'Cover',
            '100% 100%' : 'Fill'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.ScaleTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        that.options = {};
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
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__scale-tools__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addClass(nodes['container'], ['style', that.params['fieldStyle']].join('-'));
        // Render options
        cm.forEach(that.params['options'], function(item){
            that.renderOption(item);
        });
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Export
        return nodes['container'];
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
        item['nodes']['container'] = cm.node('div', {'class' : 'option__item', 'title' : that.lang(item['name'])},
            item['nodes']['icon'] = cm.node('div', {'class' : [item['iconType'], item['icon']].join(' ')})
        );
        cm.appendChild(item['nodes']['container'], that.nodes['content']['inner']);
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