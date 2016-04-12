cm.define('Com.BoxTools', {
    'extend' : 'Com.AbstractInput',
    'params' : {
        'className' : 'com__box-tools',
        'inputs' : [
            {'name' : 'top', 'icon' : 'icon small edit'},
            {'name' : 'right', 'icon' : 'icon small edit'},
            {'name' : 'bottom', 'icon' : 'icon small edit'},
            {'name' : 'eft', 'icon' : 'icon small edit'}
        ]
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.myInputs = [];
    that._inherit.apply(that, arguments);
});

cm.getConstructor('Com.BoxTools', function(classConstructor, className, classProto){
    classProto.renderContent = function(){
        var that = this;
        that.myNodes['container'] = cm.node('div', {'class' : 'com__box-tools__content'},
            cm.node('div', {'class' : 'b-line line--top'},
                cm.node('div', {'class' : 'b-container'},
                    that.renderInput(that.params['inputs'][0])
                )
            ),
            cm.node('div', {'class' : 'b-line line--middle'},
                cm.node('div', {'class' : 'b-container'},
                    that.renderInput(that.params['inputs'][1])
                ),
                cm.node('div', {'class' : 'b-link-container'},
                    that.myNodes['link'] = cm.node('div', {'class' : 'b-link'})
                ),
                cm.node('div', {'class' : 'b-container'},
                    that.renderInput(that.params['inputs'][2])
                )
            ),
            cm.node('div', {'class' : 'b-line line--bottom'},
                cm.node('div', {'class' : 'b-container'},
                    that.renderInput(that.params['inputs'][3])
                )
            )
        );
        return that.myNodes['container'];
    };

    classProto.renderInput = function(item){
        var that = this;
        item = cm.merge({
            'icon' : 'small',
            'name' : '',
            'nodes' : {}
        }, item);
        // Structure
        item['nodes']['container'] = cm.node('div', {'class' : 'form-field'},
            item['nodes']['input'] = cm.node('input', {'type' : 'number', 'maxlength' : "3"})
        );
        // Events
        cm.addEvent(item['nodes']['icon'], 'click', function(){
            item['nodes']['input'].focus();
        });
        cm.allowOnlyDigit(item['nodes']['input']);
        // Push
        that.myInputs.push(item);
        return item['nodes']['container'];
    };
});