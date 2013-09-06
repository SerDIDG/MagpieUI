// Image size
var ratio = viewer['image'].offsetWidth / viewer['image'].offsetHeight;

if(ratio > 1){
	var width = config['previewWidth'];
	var height = width/ratio;
	
	if(height > config['previewHeight']){
		var height = config['previewHeight'];
		var width = height * ratio;
	}
}else{
	var height = config['previewHeight'];
	var width = height * ratio;
	
	if(width > config['previewWidth']){
		var width = config['previewWidth'];
		var height = width / ratio;
	}
}

viewer['image'].width = width;
viewer['image'].height = height;
// Center
viewer['image'].style.marginTop = (config['previewHeight']-height)/2 + 'px';
viewer['image'].style.marginLeft = (config['previewWidth']-width)/2 + 'px';