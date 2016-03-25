cm.define('Com.TintRange', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__tint-range',
        'min' : 360,
        'max' : 0,
        'value' : 360
    }
},
function(params){
    var that = this;
    that._inherit.apply(that, arguments);
});

cm.getConstructor('Com.TintRange', function(classConstructor, className, classProto){
    classProto.renderContent = function(){
        return cm.node('div', {'class' : 'com__tint-range__content'})
    };
});