cm.getConstructor(that.params['uploaderConstructor'], function(classConstructor){
    that.components['uploader'] = new classConstructor(
        cm.merge(that.params['uploaderParams'], {
            'container' : that.nodes['content']
        })
    );
});