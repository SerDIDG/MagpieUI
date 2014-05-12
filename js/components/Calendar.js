Com['Calendar'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'className' : '',
            'startYear' : 1900,
            'endYear' : new Date().getFullYear(),
            'renderMonthOnInit' : true,
            'startWeekDay' : 0,
            'renderSelectsInBody' : true,
            'events' : {},
            'langs' : {
                'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            }
        }, o),
        API = {
            'onDayOver' : [],
            'onDayOut' : [],
            'onDayClick' : [],
            'onMonthRender' : []
        },
        nodes = {
            'selects' : {}
        },
        selects = {},
        today = new Date(),
        current = {
            'year' : today.getFullYear(),
            'month' : today.getMonth()
        },
        previous = {},
        next = {};

    var init = function(){
        convertEvents(config['events']);
        // Render
        render();
        setMiscEvents();
        config['renderMonthOnInit'] && renderView();
    };

    var render = function(){
        var weekday;
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-calendar'},
            cm.Node('div', {'class' : 'selects'},
                nodes['months'] = cm.Node('select', {'class' : 'select months'}),
                nodes['years'] = cm.Node('select', {'class' : 'select years'})
            ),
            cm.Node('table',
                cm.Node('thead',
                    nodes['days'] = cm.Node('tr')
                ),
                nodes['dates'] = cm.Node('tbody')
            )
        );
        // Add css class
        !cm.isEmpty(config['className']) && cm.addClass(nodes['container'], config['className']);
        // Render days
        cm.forEach(7, function(i){
            weekday = i + config['startWeekDay'];
            weekday = weekday > 6? Math.abs(6 - (weekday - 1)) : weekday;
            nodes['days'].appendChild(
                cm.Node('th', config['langs']['days'][weekday])
            );
        });
        // Render selects options
        config['langs']['months'].forEach(function(item, i){
            nodes['months'].appendChild(
                cm.Node('option', {'value' : i}, item)
            );
        });
        for(var i = config['endYear']; i >= config['startYear']; i--){
            nodes['years'].appendChild(
                cm.Node('option', {'value' : i}, i)
            );
        }
        // Insert into DOM
        config['container'].appendChild(nodes['container']);
    };

    var setMiscEvents = function(){
        // Init custom selects
        selects['years'] = new Com.Select({
                'select' : nodes['years'],
                'renderInBody' : config['renderSelectsInBody']
            })
            .set(current['year'])
            .addEvent('onChange', renderView);
        selects['months'] = new Com.Select({
                'select' : nodes['months'],
                'renderInBody' : config['renderSelectsInBody']
            })
            .set(current['month'])
            .addEvent('onChange', renderView);

        nodes['selects']['years'] = selects['years'].getNodes();
        nodes['selects']['months'] = selects['months'].getNodes();
    };

    var renderView = function(){
        var date;
        // Get new today date
        today = new Date();
        // Get current month data
        date = new Date(selects['years'].get(), selects['months'].get(), 1);
        current = getMonthData(date);
        // Get previous month data
        date = new Date(current['year'], current['month'], 1);
        date.setMonth(current['month'] - 1);
        previous = getMonthData(date);
        // Get next month data
        date = new Date(current['year'], current['month'], 1);
        date.setMonth(current['month'] + 1);
        next = getMonthData(date);
        // Clear current table
        cm.clearNode(nodes['dates']);
        // Render rows
        cm.forEach(6, renderRow);
        /* *** EXECUTE API EVENTS *** */
        executeEvent('onMonthRender', current);
    };

    var renderRow = function(i){
        var startWeekDay = current['startWeekDay'] - config['startWeekDay'],
            day = ((i - 1) * 7) + 1 - (startWeekDay > 0? startWeekDay - 7 : startWeekDay),
            tr = nodes['dates'].appendChild(
                cm.Node('tr')
            );
        cm.forEach(7, function(){
            renderCell(tr, day);
            day++;
        });
    };

    var renderCell = function(tr, day){
        var td, div, params;
        tr.appendChild(
            td = cm.Node('td')
        );
        // Render day
        if(day <= 0){
            td.appendChild(
                div = cm.Node('div', (previous['dayCount'] + day))
            );
            cm.addClass(td, 'out');
            cm.addEvent(div, 'click', that.prevMonth);
        }else if(day > current['dayCount']){
            td.appendChild(
                div = cm.Node('div', (day - current['dayCount']))
            );
            cm.addClass(td, 'out');
            cm.addEvent(div, 'click', that.nextMonth);
        }else{
            td.appendChild(
                div = cm.Node('div', day)
            );
            cm.addClass(td, 'in');
            params = {
                'container' : td,
                'node' : div,
                'day' : day,
                'month' : current['month'],
                'year' : current['year'],
                'date' : new Date(current['year'], current['month'], day),
                'isWeekend' : false,
                'isToday' : false
            };
            if(today.getFullYear() == current['year'] && today.getMonth() == current['month'] && day == today.getDate()){
                params['isToday'] = true;
                cm.addClass(td, 'today');
            }
            if(/0|6/.test(new Date(current['year'], current['month'], day).getDay())){
                params['isWeekend'] = true;
                cm.addClass(td, 'weekend');
            }
            // Add events
            cm.addEvent(div, 'mouseover', function(){
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onDayOver', params);
            });
            cm.addEvent(div, 'mouseout', function(){
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onDayOut', params);
            });
            cm.addEvent(div, 'click', function(){
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onDayClick', params);
            });
            // Add to array
            current['days'][day] = params;
        }
    };

    var getMonthData = function(date){
        var o = {
            'year' : date.getFullYear(),
            'month' : date.getMonth(),
            'days' : {},
            'startWeekDay' : date.getDay()
        };
        o['dayCount'] = 32 - new Date(o['year'], o['month'], 32).getDate();
        return o;
    };

    var executeEvent = function(event, params){
        var handler = function(){
            cm.forEach(API[event], function(item){
                item(that, params || {});
            });
        };

        switch(event){
            default:
                handler();
                break;
        }
    };

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    /* Main */

    that.set = function(year, month){
        if(
            year >= config['startYear'] && year <= config['endYear'] &&
            month >= 0 && month <= 11
        ){
            selects['years'].set(year);
            selects['months'].set(month);
        }
        return that;
    };

    that.renderMonth = function(){
        renderView();
        return that;
    };

    that.getCurrentMonth = function(){
        return current;
    };

    that.nextMonth = function(){
        if(next['year'] <= config['endYear']){
            selects['years'].set(next['year']);
            selects['months'].set(next['month']);
        }
        return that;
    };

    that.prevMonth = function(){
        if(previous['year'] >= config['startYear']){
            selects['years'].set(previous['year']);
            selects['months'].set(previous['month']);
        }
        return that;
    };

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
};