/*!
 * zoom.js 0.4
 * http://lab.hakim.se/zoom-js
 * MIT licensed
 *
 * Copyright (C) 2011-2014 Hakim El Hattab, http://hakim.se
 *
 * Forked and extended by larscwallin.com 
 *
 */
var zoom = (function(window){

    var documentElement = window.document.body || window.document.documentElement;
    
	// The current zoom level (scale)
	var level = 1;

	// The current mouse position, used for panning
	var mouseX = 0,
		mouseY = 0;

	// Timeout before pan is activated
	var panEngageTimeout = -1,
		panUpdateInterval = -1;
    
    var transformDuration = 0.8;
    var transformEasing = 'ease';

	// Check for transform support so that we can fallback otherwise
	var supportsTransforms = 	'WebkitTransform' in documentElement.style ||
								'MozTransform' in documentElement.style ||
								'msTransform' in documentElement.style ||
								'OTransform' in documentElement.style ||
								'transform' in documentElement.style;

	if( supportsTransforms ) {
		// The easing that will be applied when we zoom in/out
		documentElement.style.transition = 'transform ' + transformDuration + 's ' + transformEasing;
		documentElement.style.OTransition = '-o-transform ' + transformDuration + 's '+ transformEasing;
		documentElement.style.msTransition = '-ms-transform ' + transformDuration + 's ' + transformEasing;
		documentElement.style.MozTransition = '-moz-transform ' + transformDuration + 's ' + transformEasing;
		documentElement.style.WebkitTransition = '-webkit-transform ' + transformDuration + 's ' + transformEasing;
	}

	// Zoom out if the user hits escape
	window.document.addEventListener( 'keyup', function( event ) {
		if( level !== 1 && event.keyCode === 27 ) {
			zoom.out();
		}
	} );

	// Monitor mouse movement for panning
	window.document.addEventListener( 'mousemove', function( event ) {
		if( level !== 1 ) {
			mouseX = event.clientX;
			mouseY = event.clientY;
		}
	} );
    
	/**
	 * Applies the CSS required to zoom in, prefers the use of CSS3
	 * transforms but falls back on zoom for IE.
	 *
	 * @param {Object} rect
	 * @param {Number} scale     
	 */
	function magnify( rect, scale ) {

		var scrollOffset = getScrollOffset();                
        
		// Ensure a width/height is set
		rect.width = rect.width || 1;
		rect.height = rect.height || 1;

		// Center the rect within the zoomed viewport
		rect.x -= ( window.innerWidth - ( rect.width * scale ) ) / 2;
		rect.y -= ( window.innerHeight - ( rect.height * scale ) ) / 2;

		if( supportsTransforms ) {
			// Reset
			if( scale === 1 ) {
				documentElement.style.transform = '';
				documentElement.style.OTransform = '';
				documentElement.style.msTransform = '';
				documentElement.style.MozTransform = '';
				documentElement.style.WebkitTransform = '';
			}
			// Scale
			else {
				var origin = scrollOffset.x +'px '+ scrollOffset.y +'px',
					transform = 'translate('+ -rect.x +'px,'+ -rect.y +'px) scale('+ scale +')';

				documentElement.style.transformOrigin = origin;
				documentElement.style.OTransformOrigin = origin;
				documentElement.style.msTransformOrigin = origin;
				documentElement.style.MozTransformOrigin = origin;
				documentElement.style.WebkitTransformOrigin = origin;

				documentElement.style.transform = transform;
				documentElement.style.OTransform = transform;
				documentElement.style.msTransform = transform;
				documentElement.style.MozTransform = transform;
				documentElement.style.WebkitTransform = transform;
			}
		}
		else {
			// Reset
			if( scale === 1 ) {
				documentElement.style.position = '';
				documentElement.style.left = '';
				documentElement.style.top = '';
				documentElement.style.width = '';
				documentElement.style.height = '';
				documentElement.style.zoom = '';
			}
			// Scale
			else {
				documentElement.style.position = 'relative';
				documentElement.style.left = ( - ( scrollOffset.x + rect.x ) / scale ) + 'px';
				documentElement.style.top = ( - ( scrollOffset.y + rect.y ) / scale ) + 'px';
				documentElement.style.width = ( scale * 100 ) + '%';
				documentElement.style.height = ( scale * 100 ) + '%';
				documentElement.style.zoom = scale;
			}
		}

		level = scale;
	}

	/**
	 * Pan the document when the mosue cursor approaches the edges
	 * of the window.
	 */
	function pan() {
		var range = 0.12,
			rangeX = window.innerWidth * range,
			rangeY = window.innerHeight * range,
			scrollOffset = getScrollOffset();

		// Up
		if( mouseY < rangeY ) {
			window.scroll( scrollOffset.x, scrollOffset.y - ( 1 - ( mouseY / rangeY ) ) * ( 14 / level ) );
		}
		// Down
		else if( mouseY > window.innerHeight - rangeY ) {
			window.scroll( scrollOffset.x, scrollOffset.y + ( 1 - ( window.innerHeight - mouseY ) / rangeY ) * ( 14 / level ) );
		}

		// Left
		if( mouseX < rangeX ) {
			window.scroll( scrollOffset.x - ( 1 - ( mouseX / rangeX ) ) * ( 14 / level ), scrollOffset.y );
		}
		// Right
		else if( mouseX > window.innerWidth - rangeX ) {
			window.scroll( scrollOffset.x + ( 1 - ( window.innerWidth - mouseX ) / rangeX ) * ( 14 / level ), scrollOffset.y );
		}
	}

	function getScrollOffset() {
		return {
			x: window.scrollX !== undefined ? window.scrollX : window.pageXOffset,
			y: window.scrollY !== undefined ? window.scrollY : window.pageYOffset
		};
	}

	return {
		/**
		 * Zooms in on either a rectangle or HTML element.
		 *
		 * @param {Object} options
		 *   - element: HTML element to zoom in on
		 *   OR
		 *   - x/y: coordinates in non-transformed space to zoom in on
		 *   - width/height: the portion of the screen to zoom in on
		 *   - scale: can be used instead of width/height to explicitly set scale
		 */
		to: function( options ) {

			// Due to an implementation limitation we can't zoom in
			// to another element without zooming out first
			if( level !== 1 ) {
				zoom.out();
			}
			else {
				options.x = options.x || 0;
				options.y = options.y || 0;

				// If an element is set, that takes precedence
				if( !!options.element ) {
					// Space around the zoomed in element to leave on screen
					var padding = 20;
					var bounds = options.element.getBoundingClientRect();

					options.x = bounds.left - padding;
					options.y = bounds.top - padding;
					options.width = bounds.width + ( padding * 2 );
					options.height = bounds.height + ( padding * 2 );
				}

				// If width/height values are set, calculate scale from those values
				if( options.width !== undefined && options.height !== undefined ) {
					options.scale = Math.max( Math.min( window.innerWidth / options.width, window.innerHeight / options.height ), 1 );
				}

				if( options.scale > 1 ) {
					options.x *= options.scale;
					options.y *= options.scale;

					magnify( options, options.scale );

					if( options.pan !== false ) {

						// Wait with engaging panning as it may conflict with the
						// zoom transition
						panEngageTimeout = window.setTimeout( function() {
							panUpdateInterval = window.setInterval( pan, 1000 / 60 );
						}, 800 );

					}
				}
			}
		},

		/**
		 * Resets the document zoom state to its default.
		 */
		out: function() {
			window.clearTimeout( panEngageTimeout );
			window.clearInterval( panUpdateInterval );

			magnify( { x: 0, y: 0 }, 1 );

			level = 1;
		},

		// Alias
		magnify: function( options ) { this.to( options ) },
		reset: function() { this.out() },

		zoomLevel: function() {
			return level;
		},
        
        setTransform: function( duration, easing ){
            if( duration && easing) {
                // The easing that will be applied when we zoom in/out
                documentElement.style.transition = 'transform ' + duration + 's ' + easing;
                documentElement.style.OTransition = '-o-transform ' + duration + 's ' + easing;
                documentElement.style.msTransition = '-ms-transform ' + duration + 's ' + easing;
                documentElement.style.MozTransition = '-moz-transform ' + duration + 's ' + easing;
                documentElement.style.WebkitTransition = '-webkit-transform ' + duration + 's ' + easing;
            }        
        }
	}

})(window);

