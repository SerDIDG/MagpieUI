cm.define('Com.SimpleToggleBox', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'required' : [
        'Com.ToggleBox'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : false,
        'title' : false,
        'toggleTitle' : false,
        'className' : 'is-base has-title-bg'
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!that.params['title']){
            that.params['title'] = '';
            that.params['toggleTitle'] = true;
        }
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('dl', {'class' : 'com__togglebox', 'data-node' : 'ComToggleBox:{}:container'},
            cm.Node('dt', {'data-node' : 'button'},
                cm.Node('span', {'class' : 'icon default linked'}),
                cm.Node('span', {'class' : 'title', 'data-node' : 'title'}, that.params['title'])
            ),
            cm.Node('dd', {'data-node' : 'target'},
                that.nodes['content'] = cm.Node('div', {'class' : 'inner'})
            )
        );
        cm.addClass(that.nodes['container'], that.params['className']);
        // Embed
        if(that.params['container']){
            that.params['container'].appendChild(that.nodes['container']);
        }else if(that.params['node'].parentNode){
            cm.insertBefore(that.nodes['container'], that.params['node']);
        }
        that.nodes['content'].appendChild(that.params['node']);
        // Init
        that.components['toggle'] = new Com.ToggleBox(
            cm.merge(that.params, {
                'node' : that.nodes['container']
            })
        );
    };

    /* ******* MAIN ******* */

    init();
});