cm.define('Com.Range', {
    'extend' : 'Com.AbstractRange',
    'params' : {
        'className' : 'com__range',
        'theme' : 'theme--default',
        'min' : 0,
        'max' : 100,
        'value' : 0
    }
},
function(params){
    var that = this;
    Com.AbstractRange.apply(that, arguments);
});

cm.getConstructor('Com.Range', function(classConstructor, className, classProto, classInherit){
    classProto.renderRangeContent = function(){
        var that = this,
            nodes = {};
        that.nodes['rangeContent'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__range__field'},
            nodes['bar'] = cm.node('div', {'class' : 'bar'},
                nodes['range'] = cm.node('div', {'class' : 'range'})
            ),
            cm.node('div', {'class' : 'min'}, that.params['min']),
            cm.node('div', {'class' : 'max'}, that.params['max'])
        );
        // Export
        return nodes['container'];
    };

    classProto.setBarRange = function(){
        var that = this;
        var values = cm.clone(that.tempRawValue);
        if(!that.params['range']){
            values.push(that.params['min']);
        }
        values = cm.arraySort(values, false, 'desc');
        values[0] = that.getBarRangeValuePosition(values[0]);
        values[1] = that.getBarRangeValuePosition(values[1]);
        that.nodes['rangeContent']['range'].style.left = values[0] + 'px';
        that.nodes['rangeContent']['range'].style.width = values[1] - values[0] + 'px';
    };

    classProto.getBarRangeValuePosition = function(value){
        var that = this,
            dimensions = cm.getFullRect(that.nodes['rangeContent']['bar']),
            dv = value - that.params['min'],
            xn = that.params['max'] - that.params['min'],
            yn,
            zn;
        switch(that.params['direction']){
            case 'horizontal':
                yn = dimensions['absoluteWidth'];
                zn = (yn / xn) * dv;
                value = Math.round(zn);
                break;
            case 'vertical':
                yn = dimensions['absoluteHeight'];
                zn = (yn / xn) * dv;
                value = Math.round(zn);
                break;
        }
        return value;
    };

    /*** DATA ***/

    classProto.selectData = function(){
        var that = this;
        // Set bar range
        that.setBarRange();
    };

    classProto.setData = function(){
        var that = this;
        // Call parent method - setData
        classInherit.prototype.setData.apply(that, arguments);
        // Set range bar
        that.setBarRange();
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('range', {
    'node' : cm.node('input', {'type' : 'text'}),
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.Range'
});