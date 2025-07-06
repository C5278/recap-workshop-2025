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

Clone the branch `main` from this repository and we will start the exercise from here. `main` branch has a basic implementation of a order processing service.
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

                await UPDATE(Header).set({ OrderStatus: 'Submitted' }).where({ ID: req.params[0].ID });

                req.notify('Order placed successfully');
            } catch (e) {
                req.reject(500, e.message);
            }
        });
   ```


7. Now lets create two services for Inventory update and Rewards calculation. These are extrenal services which can be consumed as a odata service.

    7.1. Create a new folder named `inventory` under the `srv` directory. This folder will contain the service definition and handler files needed to call the Inventory destination.

      a. Create a file named `index.cds` in the `srv/inventory` folder with the following content:

    ```cds

        service InventoryService {}

    ```

      b. Create a file named `index.js` in the same folder with the following content:

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
    ```

    c. Configure the Inventory service to be queued, and define the Inventory REST API destination under cds.requires in `package.json` to enable calls to the Inventory REST API

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

    7.2. Create a new folder named `rewards` under the `srv` directory. This folder will contain the service definition and handler files needed to call the Rewards destination.

    1. Create a file named `index.cds` in the `srv/rewards` folder with the following content:

        ```cds
            service RewardService {}
        ```

    2. Create a file named `index.js` in the same folder with the following content:

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
        ```
         
    3. Configure the Rewards service to be queued, and define the Rewards REST API destination under cds.requires in `package.json` to enable calls to the Rewards REST API

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

8. Now lets outbox these services from order processing service, 

    8.1 Inventory needs to be updated after the order is submitted. This can be done by outboxing Inventory Service. Add below code for after Header Update statement

    ```javascript

        // Get the queued Inventory service
        const qd_inventoryService = cds.queued(await cds.connect.to("InventoryService"));

        // Store the inventory service event/message to be emitted after the transaction with the required data
        await qd_inventoryService.send("updateStock", { orderNumber: orderData.OrderNumber, userID: req.user.id, payload: { productID: itemData.Product_ID, quantityPurchased: itemData.Quantity } });
    ```

    8.2 Reward points to be calculated after the submission. This can be done by outboxing Rewards Service. Add below code for after Header Update statement

    ```javascript

    // Get the queued Reward service
    const qd_rewardService = cds.queued(await cds.connect.to("RewardService"));

    // Store the reward service event/message to be emitted after the transaction with the required data
    await qd_rewardService.send("updateRewards", { orderNumber: orderData.OrderNumber, userID: req.user.id, payload: { customerID: orderData.Customer_ID, purchaseAmount: totalAmount } });
    
    ```
 
9. Configure the destination in BTP
    9.1 Download `rewards-api` from the root folder and import it to the BTP Destination and configure client-secret as  6060b733-0a5f-4e80-a3fe-be71d5f68d90$5f3tCbMq0P3ytLCYCjC-Y37nUVzNmfrXH4k2avKmESg=
    9.1 Download `inventory-api` from the root folder and import it to the BTP Destination and configure client-secret as  5ee16b59-e586-4703-acef-a99a6385f0f3$2f9bpM2-eMy9DYFY5XVO7OskW9RsYgM8aR_vXKHmRfU=
10. Deploy app to BTP

    ```bash
        npm i
        mbt build
        cf login
        cf deploy
    ```

11. Configure SAP Build Workspace  

    11.1. Create instance for SAP Build Work Zone, standard edition.

    - In the subaccount navigate to Instances and Subscriptions, click on Create button

    - Service -> SAP Build Work Zone, standard edition,
                 Plan -> subscriptions, standard

                 [
                  If you get the below error then follow step  below
                      `To subscribe this application link an Identity Authentication tenant to the subaccount with the "Establish Trust" option. `
                          1. Go to Trust Configuration and click on Enable Trust
                          2. Select '.trial-accounts.ondemand.com' and enable the IAS tenant
                          3. Click on `Administration Console` and click on forgot to password, to set password for user.
                          4. Go to `Role Collections` and provide `Launchpad_Admin` role to the user.
                          5. Now you are ready to create `SAP Build Work Zone` instance, go to step 12.1
                 ]
                 
    - Click on SAP Build Work Zone instance and go to the application
    - After login in to the Application, Click on `Create Site` with name 'Sales Order'
    - Now Navigate to Content Manager > Content Explorer > HTML5 Apps 
    - Choose `Manage Sales Order` app and click on add
    - Now create a catalog by Content Manager > Create > Catalog and Enable `Manage Sales Order` app 
    - Now create a catalog by Content Manager > Create > Group and Enable `Manage Sales Order` app 
    - Navigate to Role called `Everyone`, click on edit and enable  `Manage Sales Order` app 
    - Now click on the sales order site URL. you should be able to see the sales order application

12. Now you should be able to test the application from the new site
        
13. Add **Notification configuration** to the project:

    13.1. In the terminal, run the following command to add the notifications module to your CAP project:
           
    ```bash
    cds add notifications            
    ```

    13.2. This command will automatically:

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
                - name: salesorder-db```

14. Create a file called `notification-types.json` under `/srv` to define Notification types 

    ```json
    [
      {
        "NotificationTypeKey": "rewards",
        "NotificationTypeVersion": "1",
        "Templates": [
          {
            "Language": "en",
            "TemplatePublic": "Sales Order",
            "TemplateSensitive": "You have {{NewReward}} reward points after your last order {{OrderNumber}}",
            "TemplateGrouped": "Rewards",
            "TemplateLanguage": "mustache",
            "Subtitle": "Customer rewards has been updated"
          }
        ]
      },
      {
        "NotificationTypeKey": "inventory",
        "NotificationTypeVersion": "1",
        "Templates": [
          {
            "Language": "en",
            "TemplatePublic": "Sales Order",
            "TemplateSensitive": "Sales Order {{OrderNumber}} Update",
            "TemplateGrouped": "Sales Order {{OrderNumber}} Update",
            "TemplateLanguage": "mustache",
            "Subtitle": "Stock has been updated"
          }
        ]
      }
    ]
    
    ```
15. Now refer this file in `package.json` under `cds.requires`

    ```json
    "cds": {
    "requires": {
      "notifications": {
        "types": "srv/notification-types.json"
      },

    ```

16. Now these notifications are ready to be used. We have integrated an external service for rewards calculation. We can add a fiori notification after the rewards calculated.
    Create a new file under /lib/rewards-notification.js and paste below code

    ```javascript

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
                              Value: newReward.toString(),
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
          
    ```
        

17. Now lets say, we need to have the notification to be send to the user after calculating the rewards points. 

    ```javascript
    
          const cds = require("@sap/cds");

          //Import the rewards notification utility
          const notification = require('../lib/rewards-notification');

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
                      await notification.sendNotification("rewards",req.data.orderNumber, response.rewardPoints, req.data.userID)
                  } catch (e) {
                      // Rethrow the error so queue can retry
                      throw e;
                  }
              })
          } 
      ```
  
18. Similarly enable notification on inventory service (Optional try it yourself)
19. To receive these notification on the SAP Build Workspace, we need to enable SAP_Notifications Destination as described in the [here](https://help.sap.com/docs/build-work-zone-standard-edition/sap-build-work-zone-standard-edition/enabling-notifications-for-custom-apps-on-sap-btp-cloud-foundry#configure-the-destination-to-the-notifications-service)
    After the step mentioned in the link the following will be achieved

      19.1 A new role will be created for Notification admin
      19.2 Enable Notifications in the SAP Build Workspace
      19.3 Create a destination called SAP_Notifications

20. Build and deploy the CAP project. Once deployed, your CAP application, including notification setup and service integrations, will be live on SAP BTP. Now create a new order and place the order. After the order is placed users should receive a notification.
