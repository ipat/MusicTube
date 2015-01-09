jQuery(document).ready(function($) {
	$('.processBtn').click(function() {
		$('.details').slideUp('400', function() {
			$('.loading').slideDown('400', function(){

			});

			
		});
	});
});