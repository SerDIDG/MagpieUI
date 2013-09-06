/* *** Переобразование Массива в Дерево *** */

/* С помощью ссылок */

var data = [];
for(var i1 = 0, l1 = listData.length; i1 < l1; i1++){
	var item1 = listData[i1];
	if(!item1['childs']){
		item1['childs'] = [];
	}		
	if(item1['parent_id'] > 0){
		for(var i2 = 0, l2 = listData.length; i2 < l2; i2++){
			var item2 = listData[i2]; 
			if(item1['parent_id'] == item2['id']){
				if(!item2['childs']){
					item2['childs'] = [];
				}
				item2['childs'].push(item1);
			}
		}
	}else{
		data.push(item1);
	}
}

/* Без ссылок и с сортировкой */

var data = _.clone(listData);
data.sort(function(a, b){
	if(a['parent_id'] == b['parent_id']){
		return a['position'] - b['position'];
	}else{
		return a['parent_id'] - b['parent_id'];
	}
});
for(var i1 = data.length - 1; i1 > 0; i1--){	
	if(!data[i1]['childs']){
		data[i1]['childs'] = [];
	}
	if(data[i1]['parent_id'] > 0){
		for(var i2 = data.length - 1; i2 >= 0; i2--){
			if(data[i1]['parent_id'] == data[i2]['id']){
				if(!data[i2]['childs']){
					data[i2]['childs'] = [];
				}
				data[i2]['childs'].unshift(data[i1]);
			}
		}
		data.pop();
	}
}

/* C помощью ссылок, асоциативного массива и с сортировкой */

var data = _.clone(listData);
data.sort(function(a, b){
	if(a['parent_id'] == b['parent_id']){
		return a['position'] - b['position'];
	}else{
		return a['parent_id'] - b['parent_id'];
	}
});

var data2 = {};
for(var i = 0, l = data.length; i < l; i++){
	data2[listData[i]['id']] = data[i];
}

var data3 = [];
_.foreach(data2, function(key, value){
	if(!value['childs']){
		value['childs'] = [];
	}	
	if(value['parent_id'] > 0){
		if(!data2[value['parent_id']]['childs']){
			data2[value['parent_id']]['childs'] = [];
		}
		data2[value['parent_id']]['childs'].push(value);
	}else{
		data3.push(value);
	}
});

/* С помощью средств ЖС 1.6 */

var blocks = {}; 
comments = [{'id' : 199},{'id' : 255,'pid' : 199},{'id' : 275, 'pid' : 199},{'id' : 290, 'pid' : 255}]; 
comments.forEach(function(item){ 
    item.child = blocks[item.id]||(blocks[item.id] = []);
    if(item.pid){ 
        if(blocks[item.pid]) 
            blocks[item.pid].push(item); 
        else 
            blocks[item.pid] = [item] 
    } 
 
}); 
comments.filter(function(item){return !item.pid; });

/* Сортировка плоского массива с правильной последовательностью */

var blocks = {};
// Make associative array
listData.forEach(function(item){
	blocks[item['id']] = item;
});
// Check item level
_.foreach(blocks, function(key, item){
	item['gridName'] = item['title'];
	if(item['parent_id'] > 0){
		var parent = blocks[item['parent_id']],
			level = 1;
		while(parent){
			item['gridName'] = ' - ' + item['gridName'];
			item['gridLevel'] = level;
			level++;
			parent = blocks[parent['parent_id']];
		}
	}else{
		item['gridLevel'] = 0;
	}
});
// Sort array by level
listData.sort(function(a, b){
	if(a['parent_id'] == 0){
		return a['position'] - b['position'];
	}else if(a['parent_id'] == b['parent_id']){
		return b['position'] - a['position'];
	}else{
		return a['gridLevel'] - b['gridLevel'];
	}
});
// Build new associative array of right position
blocks = {};
listData.forEach(function(item){
	blocks[item['id']] = item;
});
// Insert items after his parents
_.foreach(blocks, function(key, item){
	if(item['parent_id'] > 0){
		// Position
		var itemPos = listData.indexOf(item);
		listData.splice(itemPos,1)[0];
		var parentPos = listData.indexOf(blocks[item['parent_id']]);
		listData.splice(parentPos + 1, 0, item);
	}
});