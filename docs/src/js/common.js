if(cm._baseUrl.indexOf('serdidg.github.io') > -1){
    cm._baseUrl = [cm._baseUrl, '/MagpieUI/docs/build'].join('/');
}else{
    cm._baseUrl = [cm._baseUrl, 'docs/build'].join('/');
}
cm._assetsUrl = cm._baseUrl;

(function(){
    function init(){
        new cm.Finder('Com.Tabset', 'garage', null, render, {'multiple' : true});
    };

    function render(classObject){
        // Initial settings
        if(cm.getPageSize('winWidth') <= cm._config.adaptiveFrom){
            classObject.setParams({
                'setInitialTab' : false,
                'unsetOnReClick' : true
            });
        }else{
            classObject.setParams({
                'unsetOnReClick' : true
            });
        }
        // Resize event
        cm.customEvent.add(classObject.getStackNode(), 'pageSizeChange', function(){
            resize(classObject);
        });
    };

    init();
})();