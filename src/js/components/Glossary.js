cm.define('Com.Glossary', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'showTitle' : true,
        'Com.Tooltip' : {
            'className' : 'com__glossary__tooltip',
            'targetEvent' : 'hover'
        }
    }
},
function(params){
    var that = this;

    that.components = {};
    that.nodes = {
        'container' : cm.Node('div'),
        'title' : cm.Node('div'),
        'content' : cm.Node('div')
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'target' : that.nodes['container'],
                'content' : that.nodes['content'],
                'title' : that.params['showTitle']? that.nodes['title'].cloneNode(true) : ''
            })
        );
        that.triggerEvent('onRender', {});
    };

    /* ******* MAIN ******* */

    init();
});