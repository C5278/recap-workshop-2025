sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'recap.manage.orders',
            componentId: 'ItemsObjectPage',
            contextPath: '/Header/Items'
        },
        CustomPageDefinitions
    );
});