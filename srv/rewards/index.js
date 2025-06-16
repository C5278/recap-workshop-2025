const cds = require("@sap/cds");

const notification = require('../lib/notification')

const sendNotification = async (orderNumber, userId) => {
    //notifications
    const alert = await cds.connect.to('notifications');

    await alert.notify({
        NotificationTypeKey: "rewards",
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
    srv.on("updateRewards", async (req) => {
        const rewards = await cds.connect.to("rewards-api");

        const response = await rewards.send({
            method: 'POST',
            path: "odata/v4/rewards/UpdateReward",
            headers: { 'Content-Type': 'application/json' },
            data: JSON.parse(req.data.payload)
        })
        await notification.sendNotification("rewards",req.data.orderNumber, req.data.userID)
    })
}