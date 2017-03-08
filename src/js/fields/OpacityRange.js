cm.define('Com.OpacityRange', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__opacity-range',
        'min' : 100,
        'max' : 0,
        'value' : 100,
        'color' : 'red'
    }
},
function(params){
    var that = this;
    Com.AbstractRange.apply(that, arguments);
});

cm.getConstructor('Com.OpacityRange', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        that.myNodes = {};
        _inherit.prototype.construct.apply(that, arguments);
        that.setColor(that.params['color']);
        return this;
    };

    classProto.renderContent = function(){
        var that = this;
        that.myNodes['content'] = cm.node('div', {'class' : 'com__opacity-range__content'},
            that.myNodes['inner'] = cm.node('div', {'class' : 'inner range-helper'})
        );
        return that.myNodes['content'];
    };

    classProto.setColor = function(color){
        var that = this;
        switch(that.params['direction']){
            case 'horizontal':
                that.myNodes['inner'].style.background = 'linear-gradient(to right, ' + color + ', rgba(255,255,255,0))';
                break;
            case 'vertical':
                that.myNodes['inner'].style.background = 'linear-gradient(to bottom, ' + color + ', rgba(255,255,255,0))';
                break;
        }
        return that;
    };
});