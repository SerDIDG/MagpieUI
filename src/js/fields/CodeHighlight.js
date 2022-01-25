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
        'node' : cm.node('div'),
        'name' : '',
        'language' : 'javascript',
        'lineNumbers' : true,
        'customEvents' : true,
        'disabled' : false,
        'title' :''
    }
},
function(params){
    var that = this;

    that.components = {};
    that.disabled = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
            that.params['disabled'] = that.params['node'].disabled || that.params['node'].readOnly || that.params['disabled'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        // Code Mirror
        cm.loadScript({
            'path' : 'CodeMirror',
            'src' : '%assetsUrl%/libs/codemirror_comp/codemirror.min.js?%version%',
            'callback' : function(path){
                if(path){
                    that.components['codemirror'] = path.fromTextArea(that.params['node'], {
                        'lineNumbers' : that.params['lineNumbers'],
                        'viewportMargin' : Infinity,
                        'mode' : that.params['language']
                    });
                    that.components['codemirror'].on('change', function(cm){
                        that.params['node'].value = cm.getValue();
                    });
                }
                // Enable / Disable
                if(that.disabled){
                    that.disable();
                }else{
                    that.enable();
                }
            }
        });
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', that.redraw);
        }
    };

    /* ******* PUBLIC ******* */

    that.redraw = function(){
        that.components['codemirror'] && that.components['codemirror'].refresh();
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        that.components['codemirror'] && that.components['codemirror'].setOption('readOnly', 'nocursor');
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        that.components['codemirror'] && that.components['codemirror'].setOption('readOnly', false);
        return that;
    };

    init();
});
