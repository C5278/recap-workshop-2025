# Project Setup Guide

## Prerequisites

We are going to work with a trial account. Great if you have one otherwise create one following the steps below
[Create SAP Trial Account](https://developers.sap.com/tutorials/hcp-create-trial-account.html)

SAP Business Application Studio
If you don’t have one, no worries please create one using the link below.
[Setup SAP Business Application Studio](https://developers.sap.com/tutorials/appstudio-onboarding.html)

Before proceeding, ensure you have access to the following SAP BTP services:

- **SAP BTP HANA Cloud**
- **SAP BTP Work Zone, Standard Edition**

These services must be provisioned and configured in your SAP BTP subaccount.

## What we have to start with?
We have an order processing service, which takes an order request and then creates the order in the system. 
You may find the UI app in the app folder, entities in the db folder, and service implementation in the srv folder.

## What are we going to do?
We are going to enhance this service by adding a rewards program and an inventory update service. These are independent services that can be invoked asynchronously when an order is created.
This use case is an example of the outbox pattern, where remote operations are deferred until the main transaction has been successfully committed. This prevents accidental execution of remote calls in case the transaction is rolled back.

## Cloning the Repository in SAP Business Application Studio (BAS)

Clone the branch `develop` from this repository and we will start the exercise from here. `develop` branch has a basic implementation of a order processing service.
Follow the steps below to clone the repository in SAP BAS:

1. Open **SAP Business Application Studio** from your SAP BTP Cockpit.

2. Choose the appropriate **Dev Space** or create a new one (e.g., _Full Stack Cloud Application_).

3. Once the Dev Space is running, click **"Open"** to enter the workspace.

4. Open a new terminal by clicking on **Terminal > New Terminal**.

5. In the terminal, run the following command to clone the repository:

   ```bash
   git clone https://github.com/C5278/recap-workshop-2025.git
   cd recap-workshop-2025
   npm install
   cds build
   cds watch

6. Add the **Submit Order** functionality:

   6.1. Open the `srv/order-service.js` file and copy the below handler:

   ```javascript
        this.on('submitOrder', async (req) => {
            try {
                const orderData = await SELECT.one.from(Header).where({ ID: req.params[0].ID });

                console.log('user id', req.user.id);

                const { totalAmount } = await SELECT.one.from(Items)
                    .columns("sum(Price) as totalAmount")
                    .where({ OrderNumber: orderData.OrderNumber })

                const itemData = await SELECT.one.from(Items).where({ Header_ID: req.params[0].ID });

                // Get the queued Reward service
                const qd_rewardService = cds.queued(await cds.connect.to("RewardService"));

                // Get the queued Inventory service
                const qd_inventoryService = cds.queued(await cds.connect.to("InventoryService"));

                // Store the reward service event/message to be emitted after the transaction with the required data
                await qd_rewardService.send("updateRewards", { orderNumber: orderData.OrderNumber, userID: req.user.id, payload: { customerID: orderData.Customer_ID, purchaseAmount: totalAmount } });

                // Store the inventory service event/message to be emitted after the transaction with the required data
                await qd_inventoryService.send("updateStock", { orderNumber: orderData.OrderNumber, userID: req.user.id, payload: { productID: itemData.Product_ID, quantityPurchased: itemData.Quantity } });

                await UPDATE(Header).set({ OrderStatus: 'Submitted' }).where({ ID: req.params[0].ID });

                req.notify('Order placed successfully');
            } catch (e) {
                req.reject(500, e.message);
            }
        });
      

7. Configure the Inventory service to be queued, and define the Inventory REST API destination under cds.requires in `package.json` to enable calls to the Inventory REST API

   ```json
      "InventoryService": {
        "kind": "odata",
        "model": "srv/inventory/index",
        "impl": "srv/inventory/index"
      },
      "inventory-api": {
        "kind": "odata",
        "credentials": {
          "destination": "inventory-api"
        }
      }
   ```     

8.  Configure the Rewards service to be queued, and define the Rewards REST API destination under cds.requires in `package.json` to enable calls to the Rewards REST API

    ```json
      "RewardService": {
        "kind": "odata",
        "model": "srv/rewards/index",
        "impl": "srv/rewards/index"
      },
      "rewards-api": {
        "kind": "odata",
        "credentials": {
          "destination": "rewards-api"
        }
      }
    ```   

9. Create a new folder named `inventory` under the `srv` directory. This folder will contain the service definition and handler files needed to call the Inventory destination.

    9.1. Create a file named `index.cds` in the `srv/inventory` folder with the following content:
    ```cds
         service InventoryService {}
    ```

    9.2. Create a file named `index.js` in the same folder with the following content:
    ```javascript
    const cds = require("@sap/cds");

    // Import the inventory notification utility
    // const notification = require('../lib/notification')

    module.exports = (srv) => {

        // Define an event handler for the 'updateStock' action  
        srv.on("updateStock", async (req) => {
            try {
                // Connect to the external Inventory service (destination: 'inventory-api')
                const inventory = await cds.connect.to("inventory-api");

                // Send a POST request to the external Inventory REST API
                const response = await inventory.send({
                    method: 'POST',
                    path: "odata/v4/inventory/updateStock",
                    headers: { 'Content-Type': 'application/json' },
                    data: req.data.payload
                })

                // Trigger a notification after successfully calling the inventory service
                // await notification.sendNotification("inventory", req.data.orderNumber, req.data.userID)
            } catch (e) {
                // Rethrow the error so queue can retry
                throw e;
            }
        })
    }

10. Create a new folder named `rewards` under the `srv` directory. This folder will contain the service definition and handler files needed to call the Rewards destination.

    10.1. Create a file named `index.cds` in the `srv/rewards` folder with the following content:
    ```cds
         service RewardService {}
    ```

    10.2. Create a file named `index.js` in the same folder with the following content:
    ```javascript
    const cds = require("@sap/cds");

    // Import the rewards notification utility
    // const notification = require('../lib/rewards-notification');

    module.exports = (srv) => {

        // Define an event handler for the 'updateRewards' action
        srv.on("updateRewards", async (req) => {
            try {
                // Connect to the external rewards service (destination: 'rewards-api')
                const rewards = await cds.connect.to("rewards-api");

                // Send a POST request to the external rewards REST API
                const response = await rewards.send({
                    method: 'POST',
                    path: "odata/v4/rewards/UpdateReward",
                    headers: { 'Content-Type': 'application/json' },
                    data: req.data.payload
                });

                // Trigger a notification with the returned reward points and context
                // await notification.sendNotification("rewards",req.data.orderNumber, response.rewardPoints, req.data.userID)
            } catch (e) {
                // Rethrow the error so queue can retry
                throw e;
            }
        })
    }   

11. Add **Notification configuration** to the project:

    11.1. In the terminal, run the following command to add the notifications module to your CAP project:
           
    ```bash
    cds add notifications            
    ```
    11.2. This command will automatically:

    - Add necessary dependencies "@cap-js/notifications" (if missing).
    - Add the following module definition (typically in `mta.yaml`) to enable notification content deployment during deployment time:

    ```yaml
          - name: notification-content-deployment
            type: nodejs
            path: gen/srv
            parameters:
              no-route: true
              no-start: true
              memory: 256MB
              disk-quota: 1GB
              tasks:
                - name: notification-content-deployment
                  command: "node node_modules/@cap-js/notifications/lib/content-deployment.js"
                  memory: 256MB
                  disk-quota: 1GB
              requires:
                - name: salesorder-destination
                - name: salesorder-connectivity
                - name: salesorder-db
    ```
    11.3. Copy the entire `lib` folder along with its contents to your working branch (e.g., `main`). 

12. Build and deploy the CAP project. Once deployed, your CAP application, including notification setup and service integrations, will be live on SAP BTP.
