/**
 * Sends a notification to a user about a new reward for an order.
 * @param {string} key - Notification type key.
 * @param {string} orderNumber - The order number related to the reward.
 * @param {string} newReward - The new reward information.
 * @param {string} userId - The recipient user's ID.
 */
const sendNotification = async (key, orderNumber, newReward, userId) => {
    try {
        console.log(`[sendNotification] Preparing to send notification.`, {
            key,
            orderNumber,
            newReward,
            userId
        });

        // Connect to the notifications service
        const alert = await cds.connect.to('notifications');
        console.log(`[sendNotification] Connected to notifications service.`);

        // Prepare notification payload
        const notificationPayload = {
            NotificationTypeKey: key,
            Recipients: [{ RecipientId: userId }],
            Priority: 'LOW',
            NotificationTypeVersion: "1",
            Properties: [
                {
                    Key: 'OrderNumber',
                    IsSensitive: false,
                    Language: 'en',
                    Value: orderNumber,
                    Type: 'String'
                },
                {
                    Key: 'NewReward',
                    IsSensitive: false,
                    Language: 'en',
                    Value: newReward,
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
        };

        console.log(`[sendNotification] Notification payload:`, notificationPayload);

        // Send the notification
        await alert.notify(notificationPayload);

        console.log(`[sendNotification] Notification sent successfully to userId: ${userId}`);
    } catch (e) {
        console.log('[sendNotification] Error at notification:', e.message);
    }
}

module.exports = { sendNotification }