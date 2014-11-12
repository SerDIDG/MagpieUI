cm.define('Com.ColorPicker', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'container' : false,
        'input' : cm.Node('div'),
        'value' : 0,
        'renderInBody' : true,
        'disabled' : false,
        'showTitleTooltip' : true,
        'icons' : {
            'picker' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__colorpicker-tooltip',
            'top' : 'targetHeight + 3'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.value = null;
    that.previousValue = null;
    that.disabled = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['input']);
        validateParams();
        render();
        setLogic();
    };

    var validateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['disabled'] = that.params['input'].disabled || that.params['disabled'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        that.nodes['container'] = cm.Node('div', {'class' : 'com__colorpicker__input'},
            that.nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'form-field has-icon-right'},
                that.nodes['input'] = cm.Node('input', {'type' : 'text', 'readOnly' : 'true'}),
                that.nodes['icon'] = cm.Node('div', {'class' : that.params['icons']['picker']})
            ),
            that.nodes['menuContainer'] = cm.Node('div', {'class' : 'form'},
                that.nodes['paletteContainer'] = cm.Node('div')
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            that.nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['input'].id){
            that.nodes['container'].id = that.params['input'].id;
        }
        /* *** INSERT INTO DOM *** */
        if(that.params['container']){
            that.params['container'].appendChild(that.nodes['container']);
        }else if(that.params['input'].parentNode){
            cm.insertBefore(that.nodes['container'], that.params['input']);
        }
        cm.remove(that.params['input']);
        /* *** EVENTS *** */
        that.triggerEvent('onRender');
    };

    var setLogic = function(){
        // Render tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : that.nodes['container'],
                'content' : that.nodes['menuContainer'],
                'target' : that.nodes['container'],
                'events' : {
                    'onShowStart' : show,
                    'onHideStart' : hide
                }
            })
        );
    };

    var hide = function(){

    };

    var show = function(){

    };

    /* ******* MAIN ******* */

    init();
});