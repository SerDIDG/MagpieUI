cm.define('Com.ImageInput', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'replace',
        'title' : '',
        'placeholder' : '',
        'value' : null,
        'disabled' : false,
        'type' : 'file',              // base64 | file
        'langs' : {
            'no_image' : 'No Image',
            'browse' : 'Browse',
            'remove' : 'Remove'
        },
        'Com.GalleryPopup' : {}
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.disabled = false;
    that.value = null;
    that.file = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        // Set selected date
        if(that.params['value']){
            that.set(that.params['value'], false);
        }else{
            that.set(that.params['node'].value, false);
        }
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['placeholder'] = that.params['node'].getAttribute('placeholder') || that.params['placeholder'];
            that.params['title'] = that.params['node'].getAttribute('title') || that.params['title'];
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.disabled = that.params['disabled'];
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__image-input'},
            that.nodes['hidden'] = cm.node('input', {'type' : 'hidden'}),
            cm.node('div', {'class' : 'pt__box-item size-80'},
                cm.node('div', {'class' : 'l'},
                    that.nodes['imageContainer'] = cm.node('div', {'class' : 'pt__image has-border is-centered'},
                        that.nodes['link'] = cm.node('a', {'class' : 'inner'},
                            that.nodes['image'] = cm.node('img', {'class' : 'descr', 'alt' : ''})
                        )
                    )
                ),
                that.nodes['r'] = cm.node('div', {'class' : 'r'},
                    that.nodes['buttons'] = cm.node('div', {'class' : 'btn-wrap pull-left'},
                        cm.node('div', {'class' : 'browse-button'},
                            cm.node('button', that.lang('browse')),
                            cm.node('div', {'class' : 'inner'},
                                that.nodes['input'] = cm.node('input', {'type' : 'file'})
                            )
                        ),
                        that.nodes['remove'] = cm.node('button', that.lang('remove'))
                    )
                )
            )
        );
        if(!cm.isEmpty(that.params['title'])){
            that.nodes['imageContainer'].title = that.params['title'];
        }
        if(!cm.isEmpty(that.params['placeholder'])){
            that.nodes['r'].appendChild(
                cm.node('div', {'class' : 'hint'}, that.params['placeholder'])
            );
        }
        if(!cm.isEmpty(that.params['name'])){
            that.nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.embedStructure(that.nodes['container']);
        // Events
        cm.getConstructor('Com.GalleryPopup', function(classConstructor){
            that.components['popup'] = new classConstructor(
                cm.merge(that.params['Com.GalleryPopup'], {
                    'node' : that.nodes['imageContainer']
                })
            );
        });
        that.components['fileReader'] = new FileReader();
        cm.addEvent(that.components['fileReader'], 'load', fileReaderAction);
        cm.addEvent(that.nodes['input'], 'change', changeAction);
        cm.addEvent(that.nodes['remove'], 'click', removeAction);
    };

    var changeAction = function(){
        var file = that.nodes['input'].files[0];
        if(/^image\//.test(file.type)){
            that.file = file;
            that.components['fileReader'].readAsDataURL(that.file);
        }
    };

    var removeAction = function(){
        that.reset();
    };

    var fileReaderAction = function(e){
        set(e.target.result);
    };

    var set = function(url){
        that.value = url;
        that.nodes['hidden'].value = url;
        setImage(url);
    };

    var setImage = function(url){
        that.nodes['image'].src = url;
        cm.replaceClass(that.nodes['imageContainer'], 'is-no-hover is-no-image', 'is-zoom');
        cm.appendChild(that.nodes['remove'], that.nodes['buttons']);
        // Replace gallery item
        if(that.components['popup']){
            that.components['popup']
                .clear()
                .add({
                    'link' : that.nodes['link'],
                    'src' : url,
                    'title' : ''
                });
        }
    };

    /* ******* PUBLIC ******* */

    that.set = function(url, file){
        if(cm.isEmpty(url)){
            that.reset();
        }else{
            that.file = file;
            set(url);
        }
        return that;
    };

    that.get = function(){
        switch(that.params['type']){
            case 'base64' :
                cm.log(2);
                return that.value;
                break;
            case 'file' :
                cm.log(1);
                return that.file;
                break;
        }
    };

    that.reset = function(){
        that.file = null;
        that.value = null;
        that.nodes['hidden'].value = '';
        cm.replaceClass(that.nodes['imageContainer'], 'is-zoom', 'is-no-hover is-no-image');
        cm.remove(that.nodes['remove']);
        // Clear gallery item
        that.components['popup'] && that.components['popup'].clear();
        return that;
    };

    init();
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('image-input', {
    'node' : cm.node('input'),
    'constructor' : 'Com.ImageInput'
});