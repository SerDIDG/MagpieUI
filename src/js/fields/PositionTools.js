cm.define('Com.PositionTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'controllerEvents' : true,
        'className' : 'com__position-tools',
        'defaultValue' : 'center center',
        'fieldSize' : 'medium',                      // medium (24px) | large (32px)
        'options' : [
            {'name' : 'left top', 'icon' : 'svg__position-topleft', 'iconActive' : 'svg__position-topleft--light'},
            {'name' : 'center top', 'icon' : 'svg__position-topcenter', 'iconActive' : 'svg__position-topcenter--light'},
            {'name' : 'right top', 'icon' : 'svg__position-topright', 'iconActive' : 'svg__position-topright--light'},
            {'name' : 'left center', 'icon' : 'svg__position-middleleft', 'iconActive' : 'svg__position-middleleft--light'},
            {'name' : 'center center', 'icon' : 'svg__position-middlecenter', 'iconActive' : 'svg__position-middlecenter--light'},
            {'name' : 'right center', 'icon' : 'svg__position-middleright', 'iconActive' : 'svg__position-middleright--light'},
            {'name' : 'left bottom', 'icon' : 'svg__position-bottomleft', 'iconActive' : 'svg__position-bottomleft--light'},
            {'name' : 'center bottom', 'icon' : 'svg__position-bottomcenter', 'iconActive' : 'svg__position-bottomcenter--light'},
            {'name' : 'right bottom', 'icon' : 'svg__position-bottomright', 'iconActive' : 'svg__position-bottomright--light'}
        ]
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractInput.apply(that, arguments);
});

cm.getConstructor('Com.PositionTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.onConstructStart = function(){
        var that = this;
        that.options = {};
        // Bind context to methods
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
        nodes['container'] = cm.node('div', {'class' : 'com__position-tools__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addClass(nodes['container'], ['size', that.params['fieldSize']].join('-'));
        // Render Options
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
            'iconActive' : '',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('div', {'class' : 'option__item'},
            item['nodes']['icon'] = cm.node('div', {'class' : [item['iconType'], item['icon']].join(' ')})
        );
        cm.appendChild(item['nodes']['container'], that.nodes['content']['inner']);
        // Events
        cm.addEvent(item['nodes']['container'], 'click', function(){
            !that.disabled && that.set(item['name']);
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
            cm.removeClass(item['nodes']['container'], 'active');
            cm.replaceClass(item['nodes']['icon'], item['iconActive'], item['icon']);
        }
        if(that.options[that.value]){
            item = that.options[that.value];
            cm.addClass(item['nodes']['container'], 'active');
            cm.replaceClass(item['nodes']['icon'], item['icon'], item['iconActive']);
        }
    };
});