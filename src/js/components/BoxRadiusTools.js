cm.define('Com.BoxRadiusTools', {
    'extend' : 'Com.BoxTools',
    'params' : {
        'className' : 'com__box-tools com__box-tools--radius',
        'inputs' : [
            {'name' : 'topleft', 'icon' : 'icon svg__radius-topleft small linked', 'iconPosition' : 'outsideLeft'},
            {'name' : 'topright', 'icon' : 'icon svg__radius-topright small linked', 'iconPosition' : 'outsideRight'},
            {'name' : 'bottomright', 'icon' : 'icon svg__radius-bottomright small linked', 'iconPosition' : 'outsideRight'},
            {'name' : 'bottomleft', 'icon' : 'icon svg__radius-bottomleft small linked', 'iconPosition' : 'outsideLeft'}
        ]
    }
},
function(params){
    var that = this;
    Com.BoxTools.apply(that, arguments);
});

cm.getConstructor('Com.BoxRadiusTools', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__box-tools__content'},
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][0], 0),
                that.renderInput(that.params['inputs'][1], 1)
            ),
            cm.node('div', {'class' : 'b-line'},
                that.renderInput(that.params['inputs'][3], 3),
                that.renderInput(that.params['inputs'][2], 2)
            ),
            cm.node('div', {'class' : 'b-line'},
                cm.node('div', {'class' : 'b-link-container'},
                    that.myNodes['link'] = cm.node('div', {'class' : 'b-link', 'title' : that.lang('link')},
                        cm.node('div', {'class' : 'icon'})
                    )
                )
            )
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['link'], 'click', that.linkInputsHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };
});