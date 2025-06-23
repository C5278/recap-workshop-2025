const cds = require('@sap/cds')

const notification = require('./lib/notification')
const qd_rewardService = cds.queued(await cds.connect.to("RewardService"));
const qd_inventoryService = cds.queued(await cds.connect.to("InventoryService"));

class OrderService extends cds.ApplicationService {
    init() {
        const { Header, Items } = this.entities;

        this.before(['CREATE'], 'Header', async (req) => {
            const orderNumberInit = "90000001";
            let OrderNumberNew;

            const query = SELECT.from(Header).orderBy('OrderNumber desc')
            let results = await cds.run(query);
            // if (results.length === 0) {
            //   return null;
            // }

            // Return the first element (which has the highest OrderNumber)
            const lastRecord = results[0];
            if (lastRecord && lastRecord.OrderNumber) {
                try {
                    // Set OrderNumber to Header
                    OrderNumberNew = parseInt(lastRecord.OrderNumber, 10) + 1;
                    req.data.OrderNumber = OrderNumberNew.toString();


                } catch (error) {
                    console.error("Error al obtener el último número de orden:", error);
                    req.error(500, error.message);
                }
            } else {
                req.data.OrderNumber = orderNumberInit;
            }

            if (req.data.Items && Array.isArray(req.data.Items)) {
                let positionNumber = 10;
                // Retrieve the maximum position number for the specific order number
                const [result2] = await cds.run(
                    SELECT.from(Items)
                        .columns("max(PositionNumber) as maxPositionNumber")
                        .where({ OrderNumber: req.data.OrderNumber })
                );

                positionNumber = result2.maxPositionNumber;
                positionNumber++;


                for (let item of req.data.Items) {
                    if (!item.ID) {
                        item.ID = cds.utils.uuid();
                    }

                    item.OrderNumber = req.data.OrderNumber;
                    item.PositionNumber = positionNumber;
                    positionNumber++;
                }
            }
            req.data.OrderStatus = 'New'
            console.log('Order', req.data.OrderNumber)
        })

        this.before(['UPDATE'], 'Header', async (req) => {
            if (req.data.Items && Array.isArray(req.data.Items)) {
                let positionNumber = 10;
                // Retrieve the maximum position number for the specific order number
                const [result2] = await cds.run(
                    SELECT.from(Items)
                        .columns("max(PositionNumber) as maxPositionNumber")
                        .where({ OrderNumber: req.data.OrderNumber })
                );

                positionNumber = result2.maxPositionNumber;


                for (let item of req.data.Items) {
                    if (!item.PositionNumber) {
                        positionNumber++;
                        item.PositionNumber = positionNumber;
                    }
                    if (!item.ID) {
                        item.ID = cds.utils.uuid();
                    }

                    item.OrderNumber = req.data.OrderNumber;

                }
            }
        })

        this.on('submitOrder', async (req) => {
            const orderData = await SELECT.one.from(Header).where({ ID: req.params[0].ID });

            console.log('user id', req.user.id);

            // await notification.sendNotification('test', orderData.OrderNumber, req.user.id);

            const { totalAmount } = await SELECT.one.from(Items)
                .columns("sum(Price) as totalAmount")
                .where({ OrderNumber: orderData.OrderNumber })

            console.log('total', totalAmount)

            const itemData = await SELECT.one.from(Items).where({ Header_ID: req.params[0].ID });

            // TODO: Why stringify `payload` (and later parse it)?
            await qd_rewardService.send("updateRewards", { orderNumber: orderData.OrderNumber, userID: req.user.id, payload: JSON.stringify({ customerID: orderData.Customer_ID, purchaseAmount: totalAmount }) });
            await qd_inventoryService.send("updateStock", { orderNumber: orderData.OrderNumber, userID: req.user.id, payload: JSON.stringify({ productID: itemData.Product_ID, quantityPurchased: itemData.Quantity }) });

            await UPDATE(Header).set({ OrderStatus: 'Submitted' }).where({ ID: req.params[0].ID });
            req.notify('Order placed successfully');
        });
        return super.init()
    }
}


module.exports = OrderService


