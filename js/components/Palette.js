cm.define('Com.Palette', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Storage'
    ],
    'require' : [
        'Com.Draggable'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'container' : cm.Node('div'),
        'langs' : {
            'new' : 'new',
            'previous' : 'previous'
        }
    }
},
function(params){
    var that = this,
        rangeContext,
        paletteContext;

    that.nodes = {};
    that.componnets = {};
    that.value = {
        'h' : 0,
        's' : 1,
        'v' : 1
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);

        if(typeof window.tinycolor == 'undefined'){
            cm.errorLog({
                'type' : 'error',
                'name' : that._name['full'],
                'message' : 'Library "tinycolor" not defined.'
            });
        }else{
            render();
            afterRender();
        }
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
                    cm.Node('div', {'class' : 'b-top'},
                        cm.Node('div', {'class' : 'b-color-preview'},
                            cm.Node('div', {'class' : 'b-title'}, that.lang('new')),
                            cm.Node('div', {'class' : 'b-colors'},
                                that.nodes['colorNew'] = cm.Node('div', {'class' : 'b-color'}),
                                that.nodes['colorPrev'] = cm.Node('div', {'class' : 'b-color'})
                            ),
                            cm.Node('div', {'class' : 'b-title'}, that.lang('previous'))
                        )
                    )
                )
            )
        );
        // Render canvas
        paletteContext = that.nodes['paletteCanvas'].getContext('2d');
        rangeContext = that.nodes['rangeCanvas'].getContext('2d');
        renderRange();
        // Init draggable
        that.componnets['paletteDrag'] = new Com.Draggable({
            'target' : that.nodes['paletteZone'],
            'node' : that.nodes['paletteDrag'],
            'limiter' : that.nodes['paletteZone'],
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions();
                    that.value['v'] = cm.toFixed((100 - (100 / dimensions['limiter']['absoluteHeight']) * data['posY']) / 100, 2);
                    that.value['s'] = cm.toFixed(((100 / dimensions['limiter']['absoluteWidth']) * data['posX']) / 100, 2);
                    renderColorNew();
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
                    that.value['h'] = Math.floor(360 - (360 / 100) * ((100 / dimensions['limiter']['absoluteHeight']) * data['posY']));
                    renderPalette();
                    renderColorNew();
                }
            }
        });
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        renderColorPrev();
        setColor();
        that.triggerEvent('onRender');
    };

    /* *** COLORS *** */

    var setColor = function(){
        setRange();
        setPalette();
    };

    var setRange = function(){
        var dimensions = that.componnets['rangeDrag'].getDimensions(),
            posY;
        if(that.value['h'] == 0){
            posY = 0;
        }else if(that.value['h'] == 360){
            posY = dimensions['limiter']['absoluteHeight'];
        }else{
            posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * ((100 / 360) * that.value['h']);
        }
        that.componnets['rangeDrag'].setPosition(0, posY);
    };

    var setPalette = function(){
        var dimensions = that.componnets['paletteDrag'].getDimensions(),
            posY,
            posX;
        posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * (that.value['v'] * 100);
        posX = (dimensions['limiter']['absoluteWidth'] / 100) * (that.value['s'] * 100);
        that.componnets['paletteDrag'].setPosition(posX, posY);
    };

    /* *** CANVAS *** */

    var renderRange = function(){
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

    var renderPalette = function(){
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

    var renderColorNew = function(){
        var color = tinycolor(cm.clone(that.value));
        that.nodes['colorNew'].style.backgroundColor = color.toHslString();
    };

    var renderColorPrev = function(){
        var color = tinycolor(cm.clone(that.value));
        that.nodes['colorPrev'].style.backgroundColor = color.toHslString();
    };

    /* ******* MAIN ******* */

    init();
});