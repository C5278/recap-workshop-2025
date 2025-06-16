const cds = require("@sap/cds");

const notification = require('../lib/notification')


const sendNotification = async (orderNumber, userId) => {
    //notifications
    const alert = await cds.connect.to('notifications');

    await alert.notify({
        NotificationTypeKey: "inventory",
        Recipients: [{ RecipientId: userId }],
        Priority: 'HIGH',
        NotificationTypeVersion: "1",
        Properties: [
            {
                Key: 'OrderNumber',
                IsSensitive: false,
                Language: 'en',
                Value: orderNumber,
                Type: 'String'
            }
        ],
        NavigationTargetAction: "manage",
        NavigationTargetObject: "salesorder",
        TargetParameters: [
            {
                "Key": "OrderNumber",
                "Value": orderNumber
            }
        ]
    });
}

module.exports = (srv) => {
    srv.on("updateStock", async (req) => {
        try {
            const inventory = await cds.connect.to("inventory-api");

            const response = await inventory.send({
                method: 'POST',
                path: "odata/v4/inventory/updateStock",
                headers: { 'Content-Type': 'application/json' },
                data: JSON.parse(req.data.payload)
            })

            await notification.sendNotification("inventory", req.data.orderNumber, req.data.userID)
        } catch (e) {
            throw e;
        }
    })
}