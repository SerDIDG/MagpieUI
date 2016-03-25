cm.define('Com.Palette', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'require' : [
        'Com.Draggable',
        'tinycolor'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onDraw',
        'onSet',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'value' : 'transparent',
        'defaultValue' : 'rgb(255, 255, 255)',
        'setOnInit' : true,
        'langs' : {
            'new' : 'new',
            'previous' : 'previous',
            'select' : 'Select',
            'hue' : 'Hue',
            'opacity' : 'Opacity',
            'hex' : 'HEX'
        }
    }
},
function(params){
    var that = this,
        rangeContext,
        paletteContext,
        opacityContext;

    that.nodes = {};
    that.components = {};
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        initComponents();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['setOnInit'] && that.set(that.params['value'], false);
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__palette'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                cm.node('div', {'class' : 'b-palette'},
                    that.nodes['paletteZone'] = cm.node('div', {'class' : 'inner'},
                        that.nodes['paletteDrag'] = cm.node('div', {'class' : 'drag'}),
                        that.nodes['paletteCanvas'] = cm.node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.node('div', {'class' : 'b-range', 'title' : that.lang('hue')},
                    that.nodes['rangeZone'] = cm.node('div', {'class' : 'inner'},
                        that.nodes['rangeDrag'] = cm.node('div', {'class' : 'drag'}),
                        that.nodes['rangeCanvas'] = cm.node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.node('div', {'class' : 'b-range b-opacity', 'title' : that.lang('opacity')},
                    that.nodes['opacityZone'] = cm.node('div', {'class' : 'inner'},
                        that.nodes['opacityDrag'] = cm.node('div', {'class' : 'drag'}),
                        that.nodes['opacityCanvas'] = cm.node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.node('div', {'class' : 'b-stuff'},
                    cm.node('div', {'class' : 'inner'},
                        cm.node('div', {'class' : 'b-preview-color'},
                            cm.node('div', {'class' : 'b-title'}, that.lang('new')),
                            cm.node('div', {'class' : 'b-colors'},
                                that.nodes['previewNew'] = cm.node('div', {'class' : 'b-color'}),
                                that.nodes['previewPrev'] = cm.node('div', {'class' : 'b-color'})
                            ),
                            cm.node('div', {'class' : 'b-title'}, that.lang('previous'))
                        ),
                        cm.node('div', {'class' : 'b-bottom'},
                            cm.node('div', {'class' : 'b-preview-inputs'},
                                that.nodes['inputHEX'] = cm.node('input', {'type' : 'text', 'maxlength' : 7, 'title' : that.lang('hex')})
                            ),
                            cm.node('div', {'class' : 'b-buttons'},
                                that.nodes['buttonSelect'] = cm.node('div', {'class' : 'button button-primary is-wide'}, that.lang('select'))
                            )
                        )
                    )
                )
            )
        );
        // Render canvas
        paletteContext = that.nodes['paletteCanvas'].getContext('2d');
        rangeContext = that.nodes['rangeCanvas'].getContext('2d');
        opacityContext = that.nodes['opacityCanvas'].getContext('2d');
        renderRangeCanvas();
        //renderOpacityCanvas();
        // Add events
        cm.addEvent(that.nodes['inputHEX'], 'input', inputHEXHandler);
        cm.addEvent(that.nodes['inputHEX'], 'keypress', inputHEXKeypressHandler);
        cm.addEvent(that.nodes['buttonSelect'], 'click', buttonSelectHandler);
        // Append
        that.embedStructure(that.nodes['container']);
    };

    var initComponents = function(){
        that.components['paletteDrag'] = new Com.Draggable({
            'target' : that.nodes['paletteZone'],
            'node' : that.nodes['paletteDrag'],
            'limiter' : that.nodes['paletteZone'],
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['v'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['top']) / 100, 2);
                    that.value['s'] = cm.toFixed(((100 / dimensions['limiter']['absoluteWidth']) * data['left']) / 100, 2);
                    if(that.value['a'] == 0){
                        that.value['a'] = 1;
                        setOpacityDrag();
                    }
                    renderOpacityCanvas();
                    setColor();
                }
            }
        });
        that.components['rangeDrag'] = new Com.Draggable({
            'target' : that.nodes['rangeZone'],
            'node' : that.nodes['rangeDrag'],
            'limiter' : that.nodes['rangeZone'],
            'direction' : 'vertical',
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['h'] = Math.floor(360 - (360 / 100) * ((100 / dimensions['limiter']['absoluteHeight']) * data['top']));
                    if(that.value['a'] == 0){
                        that.value['a'] = 1;
                        setOpacityDrag();
                    }
                    renderPaletteCanvas();
                    renderOpacityCanvas();
                    setColor();
                }
            }
        });
        that.components['opacityDrag'] = new Com.Draggable({
            'target' : that.nodes['opacityZone'],
            'node' : that.nodes['opacityDrag'],
            'limiter' : that.nodes['opacityZone'],
            'direction' : 'vertical',
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['a'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['top']) / 100, 2);
                    setColor();
                }
            }
        });
    };

    /* *** COLORS *** */

    var setRangeDrag = function(){
        var dimensions = that.components['rangeDrag'].getDimensions(),
            position = {
                'left' : 0,
                'top' : 0
            };
        if(that.value['h'] == 0){
            position['top'] = 0;
        }else if(that.value['h'] == 360){
            position['top'] = dimensions['limiter']['absoluteHeight'];
        }else{
            position['top'] = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * ((100 / 360) * that.value['h']);
        }
        that.components['rangeDrag'].setPosition(position, false);
    };

    var setPaletteDrag = function(){
        var dimensions = that.components['paletteDrag'].getDimensions(),
            position = {
                'left' : (dimensions['limiter']['absoluteWidth'] / 100) * (that.value['s'] * 100),
                'top' : dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['v'] * 100)
            };
        that.components['paletteDrag'].setPosition(position, false);
    };

    var setOpacityDrag = function(){
        var dimensions = that.components['opacityDrag'].getDimensions(),
            position = {
                'left' : 0,
                'top' : dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['a'] * 100)
            };
        that.components['opacityDrag'].setPosition(position, false);
    };

    var inputHEXHandler = function(){
        var color = that.nodes['inputHEX'].value;
        if(!/^#/.test(color)){
            that.nodes['inputHEX'].value = '#' + color;
        }else{
            set(color, true, {'setInput' : false});
        }
    };

    var inputHEXKeypressHandler = function(e){
        var color;
        e = cm.getEvent(e);
        if(e.keyCode == 13){
            color = that.nodes['inputHEX'].value;
            set(color, true);
            buttonSelectHandler();
        }
    };

    var buttonSelectHandler = function(){
        setColorPrev();
        that.triggerEvent('onSelect', that.value);
        eventOnChange();
    };

    var set = function(color, triggerEvent, params){
        if(cm.isEmpty(color)){
            color = that.params['defaultValue'];
        }else if(color == 'transparent'){
            color = {'h' : 360,  's' : 0,  'v' : 1, 'a' : 0};
        }
        that.value = tinycolor(color).toHsv();
        that.redraw(true, params);
        // Trigger onSet event
        if(triggerEvent){
            that.triggerEvent('onSet', that.value);
        }
    };
    
    var setColor = function(){
        setPreviewNew();
        setPreviewInputs();
        setPaletteDragColor();
        that.triggerEvent('onSet', that.value);
    };

    var setColorPrev = function(){
        if(that.value){
            that.previousValue = cm.clone(that.value);
        }else{
            if(!cm.isEmpty(that.params['value'])){
                that.previousValue = tinycolor(that.params['value']).toHsv();
            }else{
                that.previousValue = tinycolor(that.params['defaultValue']).toHsv();
            }
        }
        setPreviewPrev();
    };

    var setPaletteDragColor = function(){
        var color = tinycolor(cm.clone(that.value));
        if(color.isDark()){
            cm.replaceClass(that.nodes['paletteDrag'], 'is-light', 'is-dark');
        }else{
            cm.replaceClass(that.nodes['paletteDrag'], 'is-dark', 'is-light');
        }
    };

    var setPreviewNew = function(){
        var color = tinycolor(cm.clone(that.value));
        that.nodes['previewNew'].style.backgroundColor = color.toHslString();
    };

    var setPreviewPrev = function(){
        var color = tinycolor(cm.clone(that.previousValue));
        that.nodes['previewPrev'].style.backgroundColor = color.toHslString();
    };

    var setPreviewInputs = function(){
        var color = tinycolor(cm.clone(that.value));
        that.nodes['inputHEX'].value = color.toHexString();
    };

    var eventOnChange = function(){
        if(JSON.stringify(that.value) === JSON.stringify(that.previousValue) ){
            that.triggerEvent('onChange', that.value);
        }
    };

    /* *** CANVAS *** */

    var renderRangeCanvas = function(){
        var gradient = rangeContext.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, 'rgb(255, 0, 0)');
        gradient.addColorStop(1/6, 'rgb(255, 0, 255)');
        gradient.addColorStop(2/6, 'rgb(0, 0, 255)');
        gradient.addColorStop(3/6, 'rgb(0, 255, 255)');
        gradient.addColorStop(4/6, 'rgb(0, 255, 0)');
        gradient.addColorStop(5/6, 'rgb(255, 255, 0)');
        gradient.addColorStop(1, 'rgb(255, 0, 0)');
        rangeContext.fillStyle = gradient;
        rangeContext.fillRect(0, 0, 100, 100);
    };

    var renderPaletteCanvas = function(){
        var gradient;
        // Fill color
        paletteContext.rect(0, 0, 100, 100);
        paletteContext.fillStyle = 'hsl(' +that.value['h']+', 100%, 50%)';
        paletteContext.fill();
        // Fill saturation
        gradient = paletteContext.createLinearGradient(0, 0, 100, 0);
        paletteContext.fillStyle = gradient;
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        paletteContext.fillRect(0, 0, 100, 100);
        // Fill brightness
        gradient = paletteContext.createLinearGradient(0, 0, 0, 100);
        paletteContext.fillStyle = gradient;
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
        paletteContext.fillRect(0, 0, 100, 100);
    };

    var renderOpacityCanvas = function(){
        opacityContext.clearRect(0, 0, 100, 100);
        var gradient = opacityContext.createLinearGradient(0, 0, 0, 100),
            startColor = cm.clone(that.value),
            endColor = cm.clone(that.value);
        startColor['a'] = 1;
        endColor['a'] = 0;
        opacityContext.fillStyle = gradient;
        gradient.addColorStop(0, tinycolor(startColor).toRgbString());
        gradient.addColorStop(1, tinycolor(endColor).toRgbString());
        opacityContext.fillRect(0, 0, 100, 100);
    };

    /* ******* MAIN ******* */

    that.set = function(color, triggerEvent, params){
        triggerEvent = typeof triggerEvent == 'undefined'? true : triggerEvent;
        params = typeof params == 'undefined' ? {} : params;
        // Render new color
        set(color, triggerEvent, params);
        // Render previous color
        setColorPrev();
        return that;
    };

    that.get = function(method){
        var color = tinycolor(cm.clone(that.value));
        switch(method){
            case 'rgb':
                color = color.toRgbString();
                break;
            case 'hsl':
                color = color.toHslString();
                break;
            case 'hsv':
            case 'hsb':
                color = color.toHsvString();
                break;
            case 'hex':
            default:
                color = color.toHexString();
                break;
        }
        return color;
    };

    that.getRaw = function(method){
        var color = tinycolor(cm.clone(that.value));
        switch(method){
            case 'hsl':
                color = color.toHsl();
                break;
            case 'hsv':
            case 'hsb':
            default:
                // Color already in HSV
                break;
        }
        return color;
    };

    that.redraw = function(triggerEvent, params){
        triggerEvent = typeof triggerEvent == 'undefined'? true : triggerEvent;
        params = typeof params == 'undefined'? {} : params;
        params = cm.merge({
            'setInput' : true
        }, params);
        setOpacityDrag();
        setRangeDrag();
        setPaletteDrag();
        setPreviewNew();
        setPaletteDragColor();
        renderPaletteCanvas();
        renderOpacityCanvas();
        if(params['setInput']){
            setPreviewInputs();
        }
        if(triggerEvent){
            that.triggerEvent('onDraw');
        }
        return that;
    };

    that.isLight = function(){
        var color = tinycolor(cm.clone(that.value));
        return color.isLight();
    };

    that.isDark = function(){
        var color = tinycolor(cm.clone(that.value));
        return color.isDark();
    };

    init();
});