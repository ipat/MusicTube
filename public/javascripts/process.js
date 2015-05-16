jQuery(document).ready(function($) {
	$('.processBtn').click(function() {
		$('.details').slideUp('400', function() {
			$('.loading').slideDown('400', function(){

			});
			$('.headSpace').slideDown('400');
			setInterval (type, 600);
			loop();
			
		});
	});

	$('#edit').click(function(){
		$('.editInfo').slideDown('400');
		$('.musicInfo').slideUp('400');
		$('.headSpace').slideUp('400');
		$('#edit').slideUp('400');
	});

	function addProgressBar(addLevel){
		var defaultVal = $('progress').val();
		$('progress').animate({value: defaultVal + addLevel, duration: 400, easing: 'easeOut' });
	};

	var dots = 0;

	function type() {
	    if(dots < 3) {
	        $('#waiting').append('.');
	        dots++;
	    } else {
	        $('#waiting').html('');
	        dots = 0;
	    }
	}

	function loop() {
	    var rand = Math.round(Math.random() * (1500)) + 500;
	    setTimeout(function() {
	    		var addVal = Math.round(Math.random() * (10));
	    		if($('progress').val() + addVal < 100){
	            	addProgressBar(addVal);
	            	loop(); 
	            	console.log($('progress').val() + addVal);
	        	}
	        	console.log($('progress').val());
	    }, rand);
	};


	$('#radio input:radio').addClass('input_hidden');
	$('#radio label').click(function() {
	    $(this).addClass('selected').siblings().removeClass('selected');
	    // $(this).parents().removeClass('selected');
	});


});