cm.define('Com.ColorPicker', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage'
    ],
    'require' : [
        'Com.Tooltip',
        'Com.Palette'
    ],
    'events' : [
        'onRender',
        'onSelect',
        'onChange',
        'onClear'
    ],
    'params' : {
        'container' : false,
        'input' : cm.Node('div'),
        'value' : null,                        // Color string: transparent | hex.
        'defaultValue' : 'transparent',
        'title' : '',
        'showTitleTooltip' : true,
        'renderInBody' : true,
        'disabled' : false,
        'icons' : {
            'picker' : 'icon default linked'
        },
        'langs' : {
            'transparent' : 'Transparent'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__colorpicker-tooltip',
            'top' : 'targetHeight + 3'
        },
        'Com.Palette' : {}
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
        that.set(that.value, false);
    };

    var validateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['title'] = that.params['input'].getAttribute('title') || that.params['title'];
            that.params['disabled'] = that.params['input'].disabled || that.params['disabled'];
            that.value = that.params['input'].value;
        }
        that.value = that.params['value'] || that.value || that.params['defaultValue'];
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        that.nodes['container'] = cm.Node('div', {'class' : 'com__colorpicker'},
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
    };

    var setLogic = function(){
        // Add events on input to makes him clear himself when user wants that
        cm.addEvent(that.nodes['input'], 'keydown', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(e.keyCode == 8){
                that.clear();
                that.components['tooltip'].hide();
            }
        });
        // Render tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : that.nodes['container'],
                'content' : that.nodes['menuContainer'],
                'target' : that.nodes['container'],
                'events' : {
                    'onShowStart' : show,
                    'onHide' : hide
                }
            })
        );
        // Render palette
        that.components['palette'] = new Com.Palette(
            cm.merge(that.params['Com.Palette'], {
                'container' : that.nodes['menuContainer'],
                'events' : {
                    'onChange' : function(my, value){
                        set(my.get('hex'), true);
                        that.components['tooltip'].hide();
                    }
                }
            })
        );
        // Enable / Disable
        if(that.disabled){
            that.disable();
        }else{
            that.enable();
        }
        // Trigger render event
        that.triggerEvent('onRender');
    };

    var set = function(color, triggerEvents){
        that.previousValue = that.value;
        if(cm.isEmpty(color)){
            color = 'transparent';
        }
        that.value = color;
        that.components['palette'].set(that.value, false);
        that.nodes['hidden'].value = that.value;
        that.nodes['input'].value = that.value;
        if(that.value == 'transparent'){
            that.nodes['input'].value = that.lang('transparent');
            cm.replaceClass(that.nodes['input'], 'input-dark input-light', 'input-transparent');
        }else{
            that.nodes['input'].value = that.value;
            that.nodes['input'].style.backgroundColor = that.value;
            if(that.components['palette'].isDark()){
                cm.replaceClass(that.nodes['input'], 'input-transparent input-light', 'input-dark');
            }else{
                cm.replaceClass(that.nodes['input'], 'input-transparent input-dark', 'input-light');
            }
        }
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            eventOnChange();
        }
    };

    var hide = function(){
        that.components['palette'].set(that.value, false);
    };

    var show = function(){
        that.components['palette'].redraw();
    };

    var eventOnChange = function(){
        if(that.value != that.previousValue){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* ******* MAIN ******* */

    that.set = function(color, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        set(color, triggerEvents);
        return that;
    };

    that.get = function(){
        return that.value;
    };

    that.clear = function(triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        // Set default color value
        set(that.params['defaultValue'], false);
        // Trigger events
        if(triggerEvents){
            that.triggerEvent('onClear', that.value);
            eventOnChange();
        }
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        cm.addClass(that.nodes['container'], 'disabled');
        that.nodes['input'].disabled = true;
        that.components['tooltip'].disable();
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        cm.removeClass(that.nodes['container'], 'disabled');
        that.nodes['input'].disabled = false;
        that.components['tooltip'].enable();
        return that;
    };

    init();
});