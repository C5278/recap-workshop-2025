sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'recap/manage/orders/test/integration/FirstJourney',
		'recap/manage/orders/test/integration/pages/HeaderList',
		'recap/manage/orders/test/integration/pages/HeaderObjectPage',
		'recap/manage/orders/test/integration/pages/ItemsObjectPage'
    ],
    function(JourneyRunner, opaJourney, HeaderList, HeaderObjectPage, ItemsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('recap/manage/orders') + '/index.html'
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