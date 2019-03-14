cm.define('Com.ImageBox', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : false,
        'embedStructureOnRender' : false,
        'controllerEvents' : true,
        'customEvents' : true,
        'animated' : false,
        'effect' : 'none',
        'zoom' : false,
        'scrollNode' : window,
        'Com.GalleryPopup' : {
            'showCounter' : false
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct in current context
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.ImageBox', function(classConstructor, className, classProto, classInherit){
    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that.nodes = {
            'item' : {},
            'buttons' : {
                'preview' : cm.node('div')
            }
        };
        that.dimensions = {};
        that.pageDimensions = {};
        that.isProcessed = false;
        // Binds
        that.animProcessHandler = that.animProcess.bind(that);
    };

    classProto.onRedraw = function(){
        var that = this;
        if(that.params['animated']){
            that.animRestore();
            that.animProcess();
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
        // Animation
        if(that.params['animated']){
            cm.addClass(that.params['node'], 'cm-animate');
            cm.addClass(that.params['node'], ['pre', that.params['effect']].join('-'));
            cm.addEvent(that.params['scrollNode'], 'scroll', that.animProcessHandler);
            that.animProcess();
        }
        // Zoom
        if(that.params['zoom']){
            cm.getConstructor('Com.GalleryPopup', function(classConstructor){
                that.components['popup'] = new classConstructor(that.params['Com.GalleryPopup']);
            });
            that.components['popup'].collectItem(that.nodes.item);
            cm.addEvent(that.nodes.buttons['preview'], 'click', that.components['popup'].openHandler);
        }
        // Add custom event
        cm.customEvent.add(that.params['node'], 'redraw', function(){
            that.redraw();
        });
    };

    /* ******* HELPERS ******* */

    classProto.getDimensions = function(){
        var that = this;
        that.dimensions = cm.getRect(that.params['node']);
    };

    classProto.getPageDimensions = function(){
        var that = this;
        that.pageDimensions = cm.getPageSize();
    };

    /* ******* PUBLIC ******* */

    classProto.animProcess = function(){
        var that = this;
        if(!that.isProcessed){
            that.getDimensions();
            that.getPageDimensions();
            // Rules for different block sizes.
            if(that.dimensions['height'] < that.pageDimensions['winHeight']){
                // Rules for block, which size is smaller than page's.
                if(
                    that.dimensions['top'] >= 0 &&
                    that.dimensions['bottom'] <= that.pageDimensions['winHeight']
                ){
                    that.animSet();
                }
            }else{
                // Rules for block, which size is larger than page's.
                if(
                    (that.dimensions['top'] < 0 && that.dimensions['bottom'] >= that.pageDimensions['winHeight'] / 2) ||
                    (that.dimensions['bottom'] > that.pageDimensions['winHeight'] && that.dimensions['top'] <= that.pageDimensions['winHeight'] / 2)
                ){
                    that.animSet();
                }
            }
        }
    };

    classProto.animSet = function(){
        var that = this;
        that.isProcessed = true;
        cm.addClass(that.params['node'], ['animated', that.params['effect']].join(' '));
    };

    classProto.animRestore = function(){
        var that = this;
        that.isProcessed = false;
        cm.removeClass(that.params['node'], ['animated', that.params['effect']].join(' '));
    };
});