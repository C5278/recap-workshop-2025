sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'demo/orders/manage/test/integration/FirstJourney',
		'demo/orders/manage/test/integration/pages/HeaderList',
		'demo/orders/manage/test/integration/pages/HeaderObjectPage',
		'demo/orders/manage/test/integration/pages/ItemsObjectPage'
    ],
    function(JourneyRunner, opaJourney, HeaderList, HeaderObjectPage, ItemsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('demo/orders/manage') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheHeaderList: HeaderList,
					onTheHeaderObjectPage: HeaderObjectPage,
					onTheItemsObjectPage: ItemsObjectPage
                }
            },
            opaJourney.run
        );
    }
);