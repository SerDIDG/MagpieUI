window.Collector = new Com.Collector()
    .addEvent('onConstruct', function(collector, data){
        Part.Menu();
        Part.Autoresize(data['node']);
    })

    /* *** COMMON *** */

    .add('glossary', function(node){
        new Com.Glossary({
            'node' : node
        });
    })

    .add('togglebox', function(node){
        new Com.ToggleBox({
            'node' : node
        });
    })

    .add('tabset-helper', function(node){
        new Com.TabsetHelper({
            'node' : node
        });
    })

    .add('tabset', function(node){
        new Com.Tabset({
            'node' : node
        });
    })

    .add('columns', function(node){
        new Com.Columns({
            'columns' : node
        });
    })

    .add('date-select', function(node){
        new Com.DateSelect({
            'input' : node
        });
    })

    .add('time-select', function(node){
        new Com.TimeSelect({
            'input' : node
        });
    })

    .add('colorpicker', function(node){
        new Com.ColorPicker({
            'input' : node
        });
    })

    .add('imagebox', function(node){
        new Com.ImageBox({
            'node' : node
        });
    })

    .add('tags', function(node){
        new Com.TagsInput({
            'input' : node
        });
    })

    .add('datepicker', function(node){
        new Com.Datepicker({
            'input' : node
        });
    })

    .add('select', function(node){
        new Com.Select({
            'select' : node
        });
    })

    .add('spacer', function(node){
        new Com.Spacer({
            'node' : node
        });
    })

    .add('slider', function(node){
        new Com.Slider({
            'node' : node
        });
    })

    .add('menu', function(node){
        new Com.Menu({
            'node' : node
        });
    })

    .add('sortable', function(node){
        new Com.Sortable({
            'node' : node
        });
    })

    .add('help-bubble', function(node){
        new Com.HelpBubble({
            'node' : node
        });
    })

    .add('Com.CollapsibleLayout', function(node){
        new Com.CollapsibleLayout({
            'node' : node
        });
    })

    .add('Com.Form', function(node){
        new Com.Form({
            'node' : node
        });
    })

    .add('Com.CodeHighlight', function(node){
        new Com.CodeHighlight({
            'node' : node
        });
    })

    /* *** DOCS *** */

    .add('Docs.DynamicForm', function(node){
        new Docs.DynamicForm({
            'node' : node
        });
    });

cm.onReady(function(){
    window.Collector.construct();
});