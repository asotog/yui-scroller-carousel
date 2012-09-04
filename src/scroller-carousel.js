
YUI.add('scroller-carousel', function (Y) {

    function ScrollerCarousel(config) {
        ScrollerCarousel.superclass.constructor.apply(this, arguments);
    }

    ScrollerCarousel.NAME = 'scroller-carousel';

    ScrollerCarousel.ATTRS = {};

    Y.extend(ScrollerCarousel, Y.Base, {

        NEXT: 1,                                        /* Value to move the carousel to the right */

        PREV: -1,                                       /* Value to move the carousel to the left  */
        
        NAV_MENU_ITEM: ['<li><a href="#">', '' ,'</a></li>'],     /* Menu item node element of the carousel navigation */
        
        
        NAV_MENU_PREV_BUTTON: ['<button class="prev">Prev</button>'],                     /* Previous button */
        
        NAV_MENU_NEXT_BUTTON: ['<button class="next">Next</button>'],                     /* Previous button */
        
        CURRENT_PAGE: 0,                                /* Current select page */
        
        scrollView: null,                               /* Scroll view instance */

        config: null,                                   /* Config passed in the constructor parameters */

        /**
		 * This constructor method initializes the object and start rendering the carousel
		 * 
		 * @param cfg Module external configuration
		 *  
		 * {
			navigation:                            // The parent to insert the carousel nav buttons
			navMenu: Y.one('ul.scroller-menu'),    // Navigation dots *optional
			id: 'news-carousel',				   // Carousel id
			sourceNode: '#carousel-content',	   // Node element to render the carousel
			width: 600,							   // Carousel width in pixels
			pageSize: 2							   // Page size or number of items per page
		}
		*
		*/
        initializer: function (cfg) {

            this.config = cfg;

            var carouselContainer = Y.one(cfg.sourceNode);

            /* Initializes the scroll view to move the elements in the ul */
            var scrollView = new Y.ScrollView({
                id: cfg.id,
                srcNode: cfg.sourceNode,
                width: cfg.width,
                flick: {
                    minDistance: 10,
                    minVelocity: 0.3,
                    axis: 'x'
                }
            });

            /* Plug the li as elements to be moved by the pagination */
            scrollView.plug(Y.Plugin.ScrollViewPaginator, {
                selector: 'li.scroller-carousel-item'
            });

            scrollView.render();
            this.scrollView = scrollView;
            this.buildNavigation();
        },

        /**
         * Builds the navigation with prev and next buttons and also for menu navigation
         * 
         */
        buildNavigation: function () {
            var cfg = this.config;
            this.buildPrevNextButtons();
            if (cfg.nextButton && cfg.prevButton) {
                cfg.nextButton.on('click', Y.bind(this.nextPage, this));
                cfg.prevButton.on('click', Y.bind(this.prevPage, this));
            }
            if (cfg.navMenu) {
                this.buildDotsMenu();
            }
        },
        
        /**
         * Build the next and previous buttons
         * 
         */
        buildPrevNextButtons: function() {
            var cfg = this.config;
            cfg.prevButton = Y.Node.create(this.NAV_MENU_PREV_BUTTON.join(""));
            cfg.nextButton = Y.Node.create(this.NAV_MENU_NEXT_BUTTON.join(""));
            cfg.navigation.appendChild(cfg.prevButton);
            cfg.navigation.appendChild(cfg.nextButton);
            if (this.scrollView.pages.get('total') <= cfg.pageSize) {
                cfg.nextButton.addClass('disabled');
                cfg.prevButton.addClass('disabled');
            }
        },
        
        /**
         * Build the markup for the menu navigation when an UL is specified in the
         * configuration
         * 
         */
        buildDotsMenu: function() {
            var cfg = this.config;
            var itemsCount = this.scrollView.pages.get('total');
            var dotsCount = this.calculatePageNumber(cfg.pageSize, itemsCount);
            for (var i = 0; i < dotsCount; i++) {
                this.NAV_MENU_ITEM[1] = i;
                var itemsMarkup = this.NAV_MENU_ITEM.join("");
                var menuNavItem = Y.Node.create(itemsMarkup);
                cfg.navMenu.appendChild(menuNavItem);
            }
            var menuItemsList = cfg.navMenu.all('li a');
            if (menuItemsList.item(0)) {
                menuItemsList.item(0).addClass('carousel-page-active');
            }
            this.dotsItemSelectedInitEvent();
        },
        
        /**
         * Implements the logic when a navigation dot is clicked to go through the elements
         * 
         * 
         */
        dotsItemSelectedInitEvent: function () {
            var cfg = this.config;
            var me = this;
            cfg.navMenu.delegate('click', function (e) {
                e.preventDefault();
                if (!e.target.hasClass('carousel-page-active')) {
                    var index = e.target.get('innerHTML') * cfg.pageSize;
                    var count = (me.scrollView.pages.get('total') - 1) - index;
                    index = (count >= me.config.pageSize) ? index : me.scrollView.pages.get('total') - me.config.pageSize;
                    me.scrollView.pages.set("index", index);
                    me.CURRENT_PAGE = parseInt(e.target.get('innerHTML'));
                    me.updateDotsMenu();
                }
            }, 'li a');
        },
        
        /**
         * Log to see the current state of the pagination values
         * 
         */
        logCarouselData: function () {
            console.info('Total items ' + this.scrollView.pages.get('total'));
            console.info('Index ' + this.scrollView.pages.get('index'));
        },

        /**
         * After elements movement with prev or next button the dots should change base on the number of items
         * in the carousel 
         * 
         */
        updateDotsMenu: function() {
            var cfg = this.config;
            if (cfg.navMenu && cfg.navMenu.all('li a')) {
                var menuItemsList = cfg.navMenu.all('li a');
                if (menuItemsList.item(this.CURRENT_PAGE)) {
                    cfg.navMenu.all('li a').removeClass('carousel-page-active');
                    menuItemsList.item(this.CURRENT_PAGE).addClass('carousel-page-active');
                }        
            }
        },
        
        /**
         * Moves the carousel based on the current direction
         * 
         * @param moveFunction
         */
        changePage: function (moveFunction, op) {
            var currentIndex = this.scrollView.pages.get('index');
            var count = this.scrollView.pages.get('total') - ((op * currentIndex) + this.config.pageSize);
            count = (count >= this.config.pageSize) ? this.config.pageSize : count;
            for (var i = 0; i < count; i++) {
                moveFunction();
            }
            this.updatePage(op);
            this.updateDotsMenu();
        },

        /**
         * Update the page number to be used by dotsMenu updater function
         * 
         * @param op 
         */
        updatePage: function(op) {
            var cfg = this.config;
            var itemsCount = this.scrollView.pages.get('total');
            var dotsIndex = this.calculatePageNumber(cfg.pageSize, itemsCount);
            if (op == this.PREV && this.CURRENT_PAGE > 0) {
                this.CURRENT_PAGE = this.CURRENT_PAGE + op;
            } else if (op == this.NEXT && this.CURRENT_PAGE < (dotsIndex - 1)) {
                this.CURRENT_PAGE = this.CURRENT_PAGE + op;
            } else {
                this.CURRENT_PAGE = this.CURRENT_PAGE; 
            }
        },
        
        
        /**
         * Moves to previous page
         */
        prevPage: function () {
            var me = this;
            this.changePage(function () {
                me.scrollView.pages.prev();
            }, this.PREV);
        },

        /**
         * Moves to the next page
         */
        nextPage: function () {
            var me = this;
            this.changePage(function () {
                me.scrollView.pages.next();
            }, this.NEXT);
        },

        /**
         * Calculates the number of pages based on the number of items in the carousel
         * 
         * @param pageSize Number of items per page
         * @param itemsCount Total of items in the carousel
         * @return Number of pages
         */
        calculatePageNumber: function(pageSize, itemsCount) {
            var result = itemsCount % pageSize;
            if (result == 0)
                return itemsCount / pageSize;
            
            var paginationRounded = Math.round(itemsCount / pageSize);
            /* To match always the higher integer */
            return (paginationRounded < (itemsCount / pageSize)) ? paginationRounded + 1 : paginationRounded;
        },
        
        /**
         * Destructor
         * 
         */
        destructor: function () {
                
        }
    });

    Y.ScrollerCarousel = ScrollerCarousel;
}, '0.0.1', {
    requires: ['base', 'node', 'scrollview', 'scrollview-paginator', 'node-event-delegate']
});