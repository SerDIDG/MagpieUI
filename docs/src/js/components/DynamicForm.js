cm.define('Docs.DynamicForm', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'formName' : 'dynamic'
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'text' : cm.node('textarea'),
        'button' : cm.node('button')
    };
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        new cm.Finder('Com.Form', that.params['formName'], that.nodes['container'], process);
    };

    var process = function(classObject){
        that.components['form'] = classObject;
        cm.addEvent(that.nodes['button'], 'click', executeAction);
    };

    var executeAction = function(){
        var value = "that.components['form']" + that.nodes['text'].value;
        try{
            eval(value);
        }catch(e){
        }
    };

    /* ******* PUBLIC ******* */

    init();
});