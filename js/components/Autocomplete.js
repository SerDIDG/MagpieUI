cm.define('Com.Autocomplete', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage'
    ],
    'require' : [
        'Com.Tooltip'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'input' : cm.Node('input', {'type' : 'text'}),      // HTML input node
        'target' : null,                                    // HTML node
        'container' : 'document.body',
        'minLength' : 3,
        'delay' : 300,
        'data' : [],                                        // Example: [{'value' : 'foo', 'text' : 'Bar'}].
        'url' : null,                                       // Request URL.
        'params' : {

        },
        'Com.Tooltip' : {
            'hideOnOut' : true,
            'targetEvent' : 'none',
            'className' : 'com__autocomplete-tooltip',
            'width' : 'targetWidth',
            'top' : 'targetHeight + 3'
        }
    }
},
function(params){
    var that = this,
        requestDelay;

    that.isAjax = false;
    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['input'];
        }
        that.isAjax = !cm.isEmpty(that.params['url']);
    };

    var render = function(){
        // Init tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['container'],
                'target' : that.params['target']
            })
        );
        // Add events
        cm.addEvent(that.params['input'], 'input', requestHelper);
        cm.addEvent(that.params['input'], 'keydown', inputHelper);
        that.triggerEvent('onRender');
    };

    var inputHelper = function(e){
        e = cm.getEvent(e);

        switch(e.keyCode){
            // Enter and Tab keys of keyboard
            case 9:
            case 13:
                that.hide();
                break;
        }
    };

    var requestHelper = function(){
        requestDelay && clearTimeout(requestDelay);
        var request = that.params['input'].value;

        if(request.length >= that.params['minLength']){
            requestDelay = setTimeout(that.response, that.params['delay']);
        }else{
            that.hide();
        }
    };

    /* ******* MAIN ******* */

    that.renderList = function(){
        that.nodes['tooltip'] = {};
        that.nodes['tooltip']['container'] = cm.Node('div', {'class' : 'cm-items-list'},
            that.nodes['tooltip']['items'] = cm.Node('ul')
        );
        return that;
    };

    that.response = function(){
        that.show();
    };

    that.show = function(){
        that.components['tooltip'].show();
        return that;
    };

    that.hide = function(){
        that.components['tooltip'].hide();
        return that;
    };

    init();
});