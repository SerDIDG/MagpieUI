cm.define('Com.RepeatTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__repeat-tools',
        'defaultValue' : 'no-repeat',
        'options' : [
            {'name' : 'no-repeat', 'icon' : 'svg__repeat-no'},
            {'name' : 'repeat-x', 'icon' : 'svg__repeat-horizontal'},
            {'name' : 'repeat-y', 'icon' : 'svg__repeat-vertical'},
            {'name' : 'repeat', 'icon' : 'svg__repeat-both'}
        ],
        'langs' : {
            'no-repeat' : 'No',
            'repeat-x' : 'Horizontally',
            'repeat-y' : 'Vertically',
            'repeat' : 'Both'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.RepeatTools', function(classConstructor, className, classProto){
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
        nodes['container'] = cm.node('div', {'class' : 'com__repeat-tools__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
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