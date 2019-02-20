cm.define('Com.GalleryScrollPagination', {
    'extend' : 'Com.ScrollPagination',
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'pageTag' : 'ul',
        'gridClass' : null,
        'columns' : 4,
        'indent' : '12px',
        'adaptive' : true
    }
},
function(params){
    var that = this;
    // Call parent class construct in current context
    Com.ScrollPagination.apply(that, arguments);
});

cm.getConstructor('Com.GalleryScrollPagination', function(classConstructor, className, classProto, classInherit){
    classProto.setAttributes = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.setAttributes.apply(that, arguments);
        // Content
        cm.addClass(that.nodes['pages'], 'pt__grid');
        cm.addClass(that.nodes['pages'], ['col', that.params['columns']].join('-'));
        cm.addClass(that.nodes['pages'], ['indent', that.params['indent']].join('-'));
        cm.addClass(that.nodes['pages'], that.params['gridClass']);
        if(that.params['adaptive']){
            cm.addClass(that.nodes['pages'], 'is-adaptive');
        }else{
            cm.addClass(that.nodes['pages'], 'is-not-adaptive');
        }
    };
});