cm.define('Com.MultipleFileInput', {
    'extend' : 'Com.MultipleInput',
    'params' : {
        'embedStructure' : 'replace',
        'className' : 'com__multiple-file-input',
        'inputConstructor' : 'Com.FileInput',
        'inputParams' : {
            'dropzone' : false
        },
        'dropzone' : true,
        'max' : 0,                                  // 0 - infinity
        'langs' : {
            'browse' : 'Browse'
        },
        'Com.FileReader' : {},
        'Com.FileDropzone' : {}
    }
},
function(params){
    var that = this;
    that.myNodes = {};
    that.myComponents = {};
    that.dragInterval = null;
    that.isDropzoneShow = false;
    Com.MultipleInput.apply(that, arguments);
});

cm.getConstructor('Com.MultipleFileInput', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    classProto.construct = function(){
        var that = this;
        // Bind context to methods
        that.browseActionHandler = that.browseAction.bind(that);
        that.validateParamsEndHandler = that.validateParamsEnd.bind(that);
        that.itemAddProcessHandler = that.itemAddProcess.bind(that);
        that.itemAddEndHandler = that.itemAddEnd.bind(that);
        that.itemRemoveEndHandler = that.itemRemoveEnd.bind(that);
        // Add events
        that.addEvent('onValidateParamsEnd', that.validateParamsEndHandler);
        that.addEvent('onItemAddProcess', that.itemAddProcessHandler);
        that.addEvent('onItemAddEnd', that.itemAddEndHandler);
        that.addEvent('onItemRemoveEnd', that.itemRemoveEndHandler);
        // Call parent method
        _inherit.prototype.construct.apply(that, arguments);
        return that;
    };

    classProto.clear = function(){
        var that = this;
        cm.removeClass(that.myNodes['browseHolder'], 'is-hidden');
        // Call parent method
        _inherit.prototype.clear.apply(that, arguments);
        return that;
    };

    classProto.validateParamsEnd = function(){
        var that = this;
        that.params['Com.FileDropzone']['max'] = that.params['max'];
        return that;
    };

    classProto.render = function(){
        var that = this;
        // Call parent method - render
        _inherit.prototype.render.apply(that, arguments);
        // Init FilerReader
        cm.getConstructor('Com.FileReader', function(classObject, className){
            that.myComponents['reader'] = new classObject(className);
            that.myComponents['reader'].addEvent('onReadSuccess', function(my, item){
                that.addItem({
                    'value' : item
                }, true);
            });
        });
        // Init Dropzone
        if(that.params['dropzone']){
            cm.getConstructor('Com.FileDropzone', function(classObject, className){
                that.myComponents['dropzone'] = new classObject(
                    cm.merge(that.params[className], {
                        'container' : that.nodes['inner'],
                        'target' : that.nodes['holder']
                    })
                );
                that.myComponents['dropzone'].addEvent('onDrop', function(my, file){
                    that.myComponents['reader'].read(file);
                });
            });
        }
        return that;
    };

    classProto.renderContent = function(){
        var that = this;
        that.triggerEvent('onRenderContentStart');
        // Structure
        that.myNodes['container'] = cm.node('div', {'class' : 'com__multiple-file-input__content'},
            cm.node('div', {'class' : 'pt__file-line'},
                cm.node('div', {'class' : 'inner'},
                    cm.node('div', {'class' : 'browse-button'},
                        cm.node('button', {'class' : 'button button-primary'}, that.lang('browse')),
                        cm.node('div', {'class' : 'inner'},
                            that.myNodes['input'] = cm.node('input', {'type' : 'file', 'multiple' : true})
                        )
                    )
                )
            )
        );
        // Events
        that.triggerEvent('onRenderContentProcess');
        cm.addEvent(that.myNodes['input'], 'change', that.browseActionHandler);
        that.triggerEvent('onRenderContentEnd');
        // Push
        return that.myNodes['container'];
    };

    classProto.itemAddProcess = function(my, item){
        var that = this;
        item['controller'].addEvent('onClear', function(){
            that.removeItem(item);
        });
        return that;
    };

    classProto.itemAddEnd = function(){
        var that = this;
        if(that.params['max'] && (that.items.length == that.params['max'])){
            cm.addClass(that.myNodes['container'], 'is-hidden');
        }else{
            cm.removeClass(that.myNodes['container'], 'is-hidden');
        }
        return that;
    };

    classProto.itemRemoveEnd = function(){
        var that = this;
        if(that.params['max'] && (that.items.length == that.params['max'])){
            cm.addClass(that.myNodes['container'], 'is-hidden');
        }else{
            cm.removeClass(that.myNodes['container'], 'is-hidden');
        }
        return that;
    };

    /* *** PROCESS FILES *** */

    classProto.browseAction = function(e){
        var that = this,
            length = that.params['max'] ? Math.min(e.target.files.length, (that.params['max'] - that.items.length)) : e.target.files.length;
        cm.forEach(length, function(i){
            that.myComponents['reader'].read(e.target.files[i]);
        });
        return that;
    };
});