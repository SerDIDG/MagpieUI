cm.define('Com.AbstractFileManager', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onSelect',
        'onRenderHolderStart',
        'onRenderHolderProcess',
        'onRenderHolderEnd',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'embedStructure' : 'replace',
        'showStats' : true,
        'max' : 0,                                                        // 0 - infinity
        'stats' : {
            'mfu' : 0,                                                    // Max files per upload
            'umf' : 0,                                                    // Max file size
            'quote' : 0,
            'usage' : 0
        },
        'langs' : {
            'stats' : 'Statistics',
            'stats_mfu' : 'You can upload up to %mfu% files at a time.',
            'stats_umf' : 'Max file size: %umf%.',
            'stats_quote' : 'Total storage: %quote%.',
            'stats_usage' : 'Storage used: %usage%.',
            'quote_unlimited' : 'Unlimited'
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
    that.items = [];
    that.isMultiple = false;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFileManager', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.validateParams = function(){
        var that = this;
        that.isMultiple = !that.params['max'] || that.params['max'] > 1;
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.items;
    };

    classProto.select = function(){
        var that = this;
        that.triggerEvent('onSelect', that.items);
        return that.items;
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
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderHolder = function(){
        var that = this;
        that.triggerEvent('onRenderHolderStart');
        var node = cm.node('div', {'class' : 'com__file-manager__holder is-hidden'});
        that.triggerEvent('onRenderHolderProcess');
        that.triggerEvent('onRenderHolderEnd');
        return node;
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.triggerEvent('onRenderContentStart');
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-manager__content'});
        // Render Stats
        if(that.params['showStats']){
            nodes['stats'] = that.renderStats();
            cm.appendChild(nodes['stats'], nodes['container']);
        }
        // Events
        that.triggerEvent('onRenderContentProcess');
        that.nodes['content'] = nodes;
        that.triggerEvent('onRenderContentEnd');
        return nodes['container'];
    };

    classProto.renderStats = function(){
        var that = this,
            nodes = {},
            vars = {
                '%mfu%' : that.params['stats']['mfu'],
                '%umf%' : that.params['stats']['umf'],
                '%quote%' : that.params['stats']['quote'],
                '%usage%' : that.params['stats']['usage']
            };
        vars['%quote%'] = parseFloat(vars['%quote%']) === 0 ? that.lang('quote_unlimited') : vars['%quote%'] + ' Mb';
        vars['%usage%'] = vars['%usage%'] + ' Mb';
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__file-manager__stats'},
            nodes['content'] = cm.node('div', {'class' : 'com__file-manager__stats-list'},
                cm.node('ul',
                    cm.node('li', that.lang('stats_mfu', vars)),
                    cm.node('li', that.lang('stats_umf', vars)),
                    cm.node('li', that.lang('stats_quote', vars)),
                    cm.node('li', that.lang('stats_usage', vars))
                )
            )
        );
        // Init Stats ToggleBox
        cm.getConstructor('Com.ToggleBox', function(classObject, className){
            that.components['togglebox'] = new classObject(
                cm.merge(that.params[className], {
                    'node' : nodes['content'],
                    'title' : that.lang('stats')
                })
            );
        });
        // Append
        that.nodes['stats'] = nodes;
        return nodes['container'];
    };

    /* *** PROCESS FILES *** */

    classProto.processFiles = function(data){
        var that = this,
            files = [],
            max;
        if(cm.isArray(data)){
            files = data.map(function(file){
                return that.convertFile(file);
            });
        }else if(cm.isObject(data)){
            files.push(that.convertFile(data));
        }
        if(!that.params['max']){
            that.items = files;
        }else if(files.length){
            max = Math.min(0, that.params['max'], files.length);
            that.items = files.slice(0, max);
        }else{
            that.items = [];
        }
        that.triggerEvent('onSelect', that.items);
        return that;
    };

    classProto.convertFile = function(data){
        return data;
    };
});