sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'demo.orders.manage',
            componentId: 'ItemsObjectPage',
            contextPath: '/Header/Items'
        },
        CustomPageDefinitions
    );
});