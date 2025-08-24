cm.getConstructor(that.params.component.constructor, classConstructor => {
    that.components.component = new classConstructor(
        cm.merge(that.params.component.constructorParams, {
            container: that.nodes.content,
        })
    );
});
