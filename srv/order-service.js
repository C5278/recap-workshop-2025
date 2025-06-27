const cds = require('@sap/cds')

class OrderService extends cds.ApplicationService {
    init() {
        const { Header, Items } = this.entities;

        this.before(['CREATE'], 'Header', async (req) => {
            const orderNumberInit = "90000001";
            let OrderNumberNew;

            const lastRecord = await SELECT.one.from(Header).orderBy('OrderNumber desc')

            // Return the first element (which has the highest OrderNumber)
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
                const [result2] = await SELECT.from(Items)
                    .columns("max(PositionNumber) as maxPositionNumber")
                    .where({ OrderNumber: req.data.OrderNumber })

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
                const [result2] = await SELECT.from(Items)
                    .columns("max(PositionNumber) as maxPositionNumber")
                    .where({ OrderNumber: req.data.OrderNumber })

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

        return super.init()
    }
}


module.exports = OrderService


