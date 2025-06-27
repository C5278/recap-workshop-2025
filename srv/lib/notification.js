const sendNotification = async (key, orderNumber, userId) => {
    //notifications
    try {
        console.log('Notif Start');

        const alert = await cds.connect.to('notifications');

        const response = await alert.notify({
            NotificationTypeKey: key,
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
        console.log('Notif end');
    } catch (e) {
        console.log('error at notification', e.message);
    }
}

module.exports = { sendNotification }
