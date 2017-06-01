cm.define('Com.FileStats', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'mfu' : 0,                                                    // Max files per upload
        'umf' : 0,                                                    // Max file size
        'quote' : 0,
        'usage' : 0,
        'inline' : false,
        'toggleBox' : true,
        'Com.ToggleBox' : {
            'renderStructure' : true
        }
    },
    'strings' : {
        'stats' : 'Statistics',
        'mfu' : 'You can upload up to %mfu% files at a time.',
        'umf' : 'Max file size: %umf%.',
        'quote' : 'Total storage: %quote%.',
        'usage' : 'Storage used: %usage%.',
        'quote_unlimited' : 'Unlimited'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.FileStats', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderView = function(){
        var that = this,
            vars = {
                '%mfu%' : that.params['mfu'],
                '%umf%' : that.params['umf'],
                '%quote%' : that.params['quote'],
                '%usage%' : that.params['usage']
            };
        vars['%quote%'] = parseFloat(vars['%quote%']) === 0 ? that.lang('quote_unlimited') : vars['%quote%'] + ' Mb';
        vars['%usage%'] = vars['%usage%'] + ' Mb';
        that.triggerEvent('onRenderViewStart');
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__file-stats'},
            that.nodes['content'] = cm.node('div', {'class' : 'com__file-stats__list'},
                that.nodes['list'] = cm.node('ul',
                    cm.node('li', that.lang('mfu', vars)),
                    cm.node('li', that.lang('umf', vars)),
                    cm.node('li', that.lang('quote', vars)),
                    cm.node('li', that.lang('usage', vars))
                )
            )
        );
        if(that.params['inline']){
            cm.insertFirst(cm.node('li', {'class' : 'icon small info'}), that.nodes['list']);
            cm.addClass(that.nodes['content'], 'is-inline');
        }
        // Events
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Init ToggleBox
        if(that.params['toggleBox']){
            cm.getConstructor('Com.ToggleBox', function(classObject, className){
                that.components['togglebox'] = new classObject(
                    cm.merge(that.params[className], {
                        'node' : that.nodes['content'],
                        'title' : that.lang('stats')
                    })
                );
            });
        }
        return that;
    };
});