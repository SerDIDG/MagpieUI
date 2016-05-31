cm.define('Com.AbstractFileManager', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onOpen',
        'onSelect',
        'onRenderHolderStart',
        'onRenderHolderProcess',
        'onRenderHolderEnd',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'none',
        'constructCollector' : true,
        'destructCollector' : true,
        'showStats' : true,
        'stats' : {
            'mfu' : 0,                      // Max files per upload
            'umf' : 0,                      // Max file size
            'quote' : 0,
            'usage' : 0
        },
        'langs' : {
            'cancel' : 'Cancel',
            'select' : 'Select',
            'title' : 'Please select files',
            'stats' : 'Statistics',
            'stats_mfu' : 'You can upload up to %mfu% files at a time.',
            'stats_umf' : 'Max file size is %umf%.',
            'stats_quote' : 'Total storage - %quote%.',
            'stats_usage' : 'Storage used - %usage%.'
        },
        'Com.Dialog' : {
            'width' : 900,
            'removeOnClose' : false,
            'destructOnRemove' : false
        },
        'Com.ToggleBox' : {
            'renderStructure' : true
        }
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.components = {};
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFileManager', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.destructProcessHandler = that.destructProcess.bind(that);
        that.openHandler = that.open.bind(that);
        that.openEventHandler = that.openEvent.bind(that);
        that.closeHandler = that.close.bind(that);
        that.closeEventHandler = that.closeEvent.bind(that);
        // Add events
        that.addEvent('onDestructProcess', that.destructProcessHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.open = function(e){
        var that = this;
        that.openDialog();
        return that;
    };

    classProto.close = function(e){
        var that = this;
        that.closeDialog();
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        that.triggerEvent('onValidateParamsStart');
        that.triggerEvent('onValidateParamsEnd');
        return that;
    };

    classProto.destructProcess = function(){
        var that = this;
        that.components['dialog'] && that.components['dialog'].destruct();
        return that;
    };

    classProto.openEvent = function(e){
        var that = this;
        cm.preventDefault(e);
        that.open();
        return that;
    };

    classProto.closeEvent = function(e){
        var that = this;
        cm.preventDefault(e);
        that.close();
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Call parent method - render
        _inherit.prototype.render.apply(that, arguments);
        // Init Stats ToggleBox
        cm.getConstructor('Com.ToggleBox', function(classObject, className){
            that.components['togglebox'] = new classObject(
                cm.merge(that.params[className], {
                    'node' : that.nodes['statsContent'],
                    'title' : that.lang('stats')
                })
            );
        });
        // Add events
        cm.addEvent(that.params['node'], 'click', that.openEventHandler);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-manager'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                that.nodes['holder'] = that.renderHolder(),
                that.nodes['content'] = that.renderContent()
            )
        );
        // Buttons
        that.nodes['buttons'] = cm.node('div', {'class' : 'pt__buttons pull-right'},
            cm.node('div', {'class' : 'inner'},
                that.nodes['cancel'] = cm.node('button', {'class' : 'button button-transparent'}, that.lang('cancel')),
                that.nodes['select'] = cm.node('button', {'class' : 'button button-primary'}, that.lang('select'))
            )
        );
        // Render Stats
        if(that.params['showStats']){
            that.nodes['stats'] = that.renderStats();
            cm.appendChild(that.nodes['stats'], that.nodes['content']);
        }
        // Events
        that.triggerEvent('onRenderViewProcess');
        cm.addEvent(that.nodes['cancel'], 'click', that.closeEventHandler);
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderHolder = function(){
        var that = this;
        that.triggerEvent('onRenderHolderStart');
        var node = cm.node('div', {'class' : 'com__file-manager__holder'});
        that.triggerEvent('onRenderHolderProcess');
        that.triggerEvent('onRenderHolderEnd');
        return node;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        var node = cm.node('div', {'class' : 'com__file-manager__content'});
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        return node;
    };

    classProto.renderStats = function(){
        var that = this;
        var node = cm.node('div', {'class' : 'com__file-manager__stats'},
            that.nodes['statsContent'] = cm.node('div', {'class' : 'com__file-manager__stats-list'},
                cm.node('ul',
                    cm.node('li', that.lang('stats_mfu')),
                    cm.node('li', that.lang('stats_umf')),
                    cm.node('li', that.lang('stats_quote')),
                    cm.node('li', that.lang('stats_usage'))
                )
            )
        );
        return node;
    };

    classProto.openDialog = function(){
        var that = this;
        if(!that.components['dialog']){
            cm.getConstructor('Com.Dialog', function(classObject, className){
                that.components['dialog'] = new classObject(
                    cm.merge(that.params[className], {
                        'content': that.nodes['container'],
                        'buttons' : that.nodes['buttons'],
                        'title': that.lang('title'),
                        'events': {
                            'onOpen': function(){
                                that.constructCollector();
                            },
                            'onClose': function(){
                                that.destructCollector();
                            }
                        }
                    })
                );
            });
        }else{
            that.components['dialog'].open();
        }
        return that;
    };

    classProto.closeDialog = function(){
        var that = this;
        that.components['dialog'] && that.components['dialog'].close();
        return that;
    };
});