cm.define('Com.Sample', {
    extend: 'Com.AbstractController',
    params: {
        controllerEvents: true,
        renderStructure: true,
        embedStructureOnRender: true,
        embedStructure: 'append',
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Sample', function(classConstructor, className, classProto, classInherit) {
    classProto.renderViewModel = function() {
        const that = this;

        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);
    };
});
