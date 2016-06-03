cm.define('Com.elFinderFileManagerContainer', {
    'extend' : 'Com.AbstractFileManagerContainer',
    'params' : {
        'constructor' : 'Com.elFinderFileManager'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractFileManagerContainer.apply(that, arguments);
});