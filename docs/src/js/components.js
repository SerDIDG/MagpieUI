window.Collector = new Com.Collector({
        'autoInit' : true
    })
    .addEvent('onConstruct', function(collector, data){
        Part.Menu();
        Part.Autoresize(data['node']);
    });

cm.onReady(function(){
    window.Collector.construct();
});