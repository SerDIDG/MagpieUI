cm.define('Com.OpacityRange', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__range',
        'theme' : 'theme--arrows',
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

    classProto.onConstructEnd = function(){
        var that = this;
        // Set color
        that.setColor(that.params['color']);
    };

    classProto.renderRangeContent = function(){
        var that = this,
            nodes = {};
        that.nodes['rangeContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__opacity-range__content'},
            nodes['inner'] = cm.node('div', {'class' : 'inner range-helper'})
        );
        // Export
        return nodes['container'];
    };

    classProto.setColor = function(color){
        var that = this;
        switch(that.params['direction']){
            case 'horizontal':
                that.nodes['rangeContent']['inner'].style.background = 'linear-gradient(to right, ' + color + ', rgba(255,255,255,0))';
                break;
            case 'vertical':
                that.nodes['rangeContent']['inner'].style.background = 'linear-gradient(to bottom, ' + color + ', rgba(255,255,255,0))';
                break;
        }
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('opacity-range', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.OpacityRange'
});