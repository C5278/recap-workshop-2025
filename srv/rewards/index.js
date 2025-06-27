const cds = require("@sap/cds");

const notification = require('../lib/notification')

module.exports = (srv) => {
    srv.on("updateRewards", async (req) => {
        const rewards = await cds.connect.to("rewards-api");

        const response = await rewards.send({
            method: 'POST',
            path: "odata/v4/rewards/UpdateReward",
            headers: { 'Content-Type': 'application/json' },
            data: req.data.payload
        })
        await notification.sendNotification("rewards",req.data.orderNumber, req.data.userID)
    })
}