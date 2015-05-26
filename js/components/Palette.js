cm.define('Com.Palette', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage',
        'Stack'
    ],
    'require' : [
        'Com.Draggable',
        'tinycolor'
    ],
    'events' : [
        'onRender',
        'onDraw',
        'onSet',
        'onSelect',
        'onChange'
    ],
    'params' : {
        'name' : '',
        'container' : cm.Node('div'),
        'value' : '#ff0000',
        'defaultValue' : '#000000',
        'langs' : {
            'new' : 'new',
            'previous' : 'previous',
            'select' : 'Select'
        }
    }
},
function(params){
    var that = this,
        rangeContext,
        paletteContext;

    that.nodes = {};
    that.componnets = {};
    that.value = null;
    that.previousValue = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        initComponents();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.set(that.params['value'], false);
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__palette'},
            that.nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                cm.Node('div', {'class' : 'b-palette'},
                    that.nodes['paletteZone'] = cm.Node('div', {'class' : 'inner'},
                        that.nodes['paletteDrag'] = cm.Node('div', {'class' : 'drag'}),
                        that.nodes['paletteCanvas'] = cm.Node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.Node('div', {'class' : 'b-range'},
                    that.nodes['rangeZone'] = cm.Node('div', {'class' : 'inner'},
                        that.nodes['rangeDrag'] = cm.Node('div', {'class' : 'drag'}),
                        that.nodes['rangeCanvas'] = cm.Node('canvas', {'width' : '100%', 'height' : '100%'})
                    )
                ),
                cm.Node('div', {'class' : 'b-stuff'},
                    cm.Node('div', {'class' : 'inner'},
                        cm.Node('div', {'class' : 'b-preview-color'},
                            cm.Node('div', {'class' : 'b-title'}, that.lang('new')),
                            cm.Node('div', {'class' : 'b-colors'},
                                that.nodes['previewNew'] = cm.Node('div', {'class' : 'b-color'}),
                                that.nodes['previewPrev'] = cm.Node('div', {'class' : 'b-color'})
                            ),
                            cm.Node('div', {'class' : 'b-title'}, that.lang('previous'))
                        ),
                        cm.Node('div', {'class' : 'b-bottom'},
                            cm.Node('div', {'class' : 'b-preview-inputs'},
                                that.nodes['inputHEX'] = cm.Node('input', {'type' : 'text', 'maxlength' : 7})
                            ),
                            cm.Node('div', {'class' : 'b-buttons'},
                                that.nodes['buttonSelect'] = cm.Node('div', {'class' : 'button button-primary is-wide'}, that.lang('select'))
                            )
                        )
                    )
                )
            )
        );
        // Render canvas
        paletteContext = that.nodes['paletteCanvas'].getContext('2d');
        rangeContext = that.nodes['rangeCanvas'].getContext('2d');
        renderRangeCanvas();
        // Add events
        cm.addEvent(that.nodes['inputHEX'], 'input', inputHEXHandler);
        cm.addEvent(that.nodes['buttonSelect'], 'click', buttonSelectHandler);
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var initComponents = function(){
        that.componnets['paletteDrag'] = new Com.Draggable({
            'target' : that.nodes['paletteZone'],
            'node' : that.nodes['paletteDrag'],
            'limiter' : that.nodes['paletteZone'],
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['a'] = 1;
                    that.value['v'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['posY']) / 100, 2);
                    that.value['s'] = cm.toFixed(((100 / dimensions['limiter']['absoluteWidth']) * data['posX']) / 100, 2);
                    setColor();
                }
            }
        });
        that.componnets['rangeDrag'] = new Com.Draggable({
            'target' : that.nodes['rangeZone'],
            'node' : that.nodes['rangeDrag'],
            'limiter' : that.nodes['rangeZone'],
            'direction' : 'vertical',
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['a'] = 1;
                    that.value['h'] = Math.floor(360 - (360 / 100) * ((100 / dimensions['limiter']['absoluteHeight']) * data['posY']));
                    renderPaletteCanvas();
                    setColor();
                }
            }
        });
    };

    /* *** COLORS *** */

    var setRangeDrag = function(){
        var dimensions = that.componnets['rangeDrag'].getDimensions(),
            posY;
        if(that.value['h'] == 0){
            posY = 0;
        }else if(that.value['h'] == 360){
            posY = dimensions['limiter']['absoluteHeight'];
        }else{
            posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * ((100 / 360) * that.value['h']);
        }
        that.componnets['rangeDrag'].setPosition(0, posY, false);
    };

    var setPaletteDrag = function(){
        var dimensions = that.componnets['paletteDrag'].getDimensions(),
            posY,
            posX;
        posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['v'] * 100);
        posX = (dimensions['limiter']['absoluteWidth'] / 100) * (that.value['s'] * 100);
        that.componnets['paletteDrag'].setPosition(posX, posY, false);
    };

    var inputHEXHandler = function(){
        var color = that.nodes['inputHEX'].value;
        if(!/^#/.test(color)){
            that.nodes['inputHEX'].value = '#' + color;
        }else{
            set(color, true, {'setInput' : false});
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
        paletteContext.fillStyle = 'hsl('+that.value['h']+', 100%, 50%)';
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
        setRangeDrag();
        renderPaletteCanvas();
        setPaletteDrag();
        setPreviewNew();
        setPaletteDragColor();
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