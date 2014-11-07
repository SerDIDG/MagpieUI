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
        'container' : cm.Node('div')
    }
},
function(params){
    var that = this,
        rangeContext,
        paletteContext;

    that.nodes = {};
    that.componnets = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        afterRender();
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
            'limiter' : that.nodes['paletteZone']
        });
        that.componnets['rangeDrag'] = new Com.Draggable({
            'target' : that.nodes['rangeZone'],
            'node' : that.nodes['rangeDrag'],
            'limiter' : that.nodes['rangeZone'],
            'direction' : 'vertical',
            'events' : {
                'onSet' : function(my, data){
                    var dimensions = my.getDimensions(),
                        hue = 360 - (360 / 100) * ((100 / dimensions['limiter']['absoluteHeight']) * data['posY']);
                    renderPalette(hue);
                }
            }
        });
        // Embed
        that.params['container'].appendChild(that.nodes['container']);
    };

    var afterRender = function(){
        setHue(0);
        that.triggerEvent('onRender');
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

    var renderPalette = function(hue){
        var gradient;
        hue = Math.floor(hue);
        // Set drag position
        // Fill color
        paletteContext.rect(0, 0, 100, 100);
        paletteContext.fillStyle = 'hsl('+hue+', 100%, 50%)';
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

    var setHue = function(hue){
        hue = Math.floor(hue);
        var dimensions = that.componnets['rangeDrag'].getDimensions(),
            posY;
        if(hue == 0){
            posY = 0;
        }else if(hue == 360){
            posY = dimensions['limiter']['absoluteHeight'];
        }else{
            posY = dimensions['limiter']['absoluteHeight'] - (dimensions['limiter']['absoluteHeight'] / 100) * ((100 / 360) * hue);
        }
        that.componnets['rangeDrag'].setPosition(0, posY);
    };

    /* ******* MAIN ******* */

    init();
});