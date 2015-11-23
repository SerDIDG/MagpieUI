cm.define('Com.CodeHighlight', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'language' : 'javascript',
        'lineNumbers' : true
    }
},
function(params){
    var that = this;

    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        if(typeof CodeMirror != 'undefined'){
            that.components['codemirror'] = CodeMirror.fromTextArea(that.params['node'], {
                'lineNumbers': that.params['lineNumbers'],
                'viewportMargin': Infinity,
                'mode': that.params['language']
            });
            that.components['codemirror'].on('change', function(cm){
                that.params['node'].value = cm.getValue();
            });
        }
    };

    /* ******* PUBLIC ******* */

    init();
});