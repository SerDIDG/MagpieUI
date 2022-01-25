cm.define('Com.ColorPicker', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Storage',
        'Stack'
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
        'input' : null,                                     // Deprecated, use 'node' parameter instead.
        'node' : cm.node('input', {'type' : 'text'}),
        'container' : null,
        'embedStructure' : 'replace',
        'name' : '',
        'value' : null,                                     // Color string: transparent | hex | rgba.
        'defaultValue' : 'transparent',
        'title' : '',
        'showLabel' : true,
        'showClearButton' : false,
        'showTitleTooltip' : true,
        'renderInBody' : true,
        'disabled' : false,
        'size' : 'default',                                 // default | full
        'icons' : {
            'picker' : 'icon default linked',
            'clear' : 'icon default linked'
        },
        'Com.Tooltip' : {
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__colorpicker__tooltip',
            'top' : cm._config.tooltipDown
        },
        'Com.Palette' : {
            'setOnInit' : false
        }
    },
    'strings' : {
        'Transparent' : 'Transparent',
        'Clear' : 'Clear'
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
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        // Add to stack
        that.addToStack(that.nodes['container']);
        // Set
        that.set(that.value, false);
        // Trigger render event
        that.triggerEvent('onRender', that.value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['disabled'] = that.params['node'].disabled || that.params['disabled'];
            that.value = that.params['node'].value;
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.value = that.params['value'] || that.value || that.params['defaultValue'];
        that.disabled = that.params['disabled'];
        that.params['Com.Palette']['name'] = [that.params['name'], 'palette'].join('-');
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        that.nodes['container'] = cm.node('div', {'class' : 'com__colorpicker'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            that.nodes['target'] = cm.node('div', {'class' : 'pt__input'},
                that.nodes['input'] = cm.node('input', {'type' : 'text', 'readOnly' : 'true'}),
                that.nodes['icon'] = cm.node('div', {'class' : that.params['icons']['picker']})
            ),
            that.nodes['menuContainer'] = cm.node('div', {'class' : 'form'},
                that.nodes['paletteContainer'] = cm.node('div')
            )
        );
        /* *** ATTRIBUTES *** */
        // Size
        if(!cm.isEmpty(that.params['size'])){
            cm.addClass(that.nodes['container'], ['size', that.params['size']].join('-'));
        }
        // Title
        if(that.params['showTitleTooltip'] && !cm.isEmpty(that.params['title'])){
            that.nodes['container'].title = that.params['title'];
        }
        // ID
        if(that.params['node'].id){
            that.nodes['container'].id = that.params['node'].id;
        }
        // Name
        if(that.params['name']){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Label
        if(!that.params['showLabel']){
            cm.addClass(that.nodes['target'], 'is-no-label');
        }
        // Clear Button
        if(that.params['showClearButton']){
            cm.addClass(that.nodes['container'], 'has-clear-button');
            that.nodes['container'].appendChild(
                that.nodes['clearButton'] = cm.node('div', {'class' : that.params['icons']['clear'], 'title' : that.lang('Clear')})
            );
        }
        /* *** INSERT INTO DOM *** */
        that.embedStructure(that.nodes['container']);
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
        // Clear Button
        if(that.params['showClearButton']){
            cm.addEvent(that.nodes['clearButton'], 'click', function(){
                that.clear();
                that.components['tooltip'].hide();
            });
        }
        // Render tooltip
        that.components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'container' : that.params['renderInBody'] ? document.body : that.nodes['container'],
                'content' : that.nodes['menuContainer'],
                'target' : that.nodes['target'],
                'events' : {
                    'onShowStart' : show,
                    'onHideStart' : hide
                }
            })
        );
        // Render palette
        that.components['palette'] = new Com.Palette(
            cm.merge(that.params['Com.Palette'], {
                'node' : that.nodes['menuContainer'],
                'events' : {
                    'onChange' : function(my, value){
                        set(my.get('rgb'), true);
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
    };

    var set = function(color, triggerEvents){
        that.previousValue = that.value;
        if(cm.isEmpty(color)){
            color = that.params['defaultValue'];
        }
        that.value = color;
        that.components['palette'].set(that.value, false);
        that.nodes['hidden'].value = that.components['palette'].get('rgb');
        if(that.value === 'transparent'){
            if(that.params['showLabel']){
                that.nodes['input'].value = that.lang('Transparent');
            }
            cm.replaceClass(that.nodes['input'], 'input-dark input-light', 'input-checkers');
        }else{
            if(that.params['showLabel']){
                that.nodes['input'].value = that.components['palette'].get('hex');
            }
            that.nodes['input'].style.backgroundColor = that.components['palette'].get('hex');
            if(that.components['palette'].isDark()){
                cm.replaceClass(that.nodes['input'], 'input-checkers input-light', 'input-dark');
            }else{
                cm.replaceClass(that.nodes['input'], 'input-checkers input-dark', 'input-light');
            }
        }
        if(triggerEvents){
            that.triggerEvent('onSelect', that.value);
            eventOnChange();
        }
    };

    var hide = function(){
        that.nodes['input'].blur();
        cm.removeClass(that.nodes['container'], 'active');
        that.components['palette'].set(that.value, false);
    };

    var show = function(){
        cm.addClass(that.nodes['container'], 'active');
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
