const cds = require("@sap/cds");

const notification = require('../lib/notification')


module.exports = (srv) => {
    srv.on("updateStock", async (req) => {
        try {
            const inventory = await cds.connect.to("inventory-api");

            const response = await inventory.send({
                method: 'POST',
                path: "odata/v4/inventory/updateStock",
                headers: { 'Content-Type': 'application/json' },
                data: req.data.payload
            })

            await notification.sendNotification("inventory", req.data.orderNumber, req.data.userID)
        } catch (e) {
            throw e;
        }
    })
}