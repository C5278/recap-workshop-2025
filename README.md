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

   6.1. In the `dev` branch, open the `srv/order-service.js` file and copy the handler:

   ```javascript
        this.on('submitOrder', async (req) => {
            ....
        });
      

7. Copy the Inventory destination configuration from `package.json`:

   7.1. Login to your BTP Trial account and import destination with file `inventory-api` in the cuurent repo 

   7.2 configure the client secret as =>  

   7.3. In the `dev` branch, open the `package.json` file.

   7.4. Locate the Inventory destination configuration under the `cds.requires` section. It typically looks like this:

   ```json
       "cds": {
         "requires": {
           "inventory-api": {
              "kind": "odata",
              "credentials": {
                "destination": "inventory-api"
               }
            }
         }
       }
   ```     

   7.3. Copy the entire `Inventory` config.

8. Copy the Rewards destination configuration from `package.json`:

   8.1. Login to your BTP Trial account and import destination with file `rewards-api` in the current repo 

   8.2 configure the client secret as =>  

   8.1. In the `dev` branch, open the `package.json` file.

   8.2. Locate the Rewards destination configuration under the `cds.requires` section. It typically looks like this:

   ```json
       "cds": {
         "requires": {
            "rewards-api": {
              "kind": "odata",
              "credentials": {
                "destination": "rewards-api"
              }
            },
         }
       }
    ```   

   8.3. Copy the entire `Rewards` configuration block.

   8.4. Open `package.json` in your working branch and paste the `Rewards` configuration inside.

9. Create the inventory folder and its service files to call the Inventory destination as in the `dev` branch:

    9.1. In dev branch, locate the `inventory` folder and its service files (`index.cds`, `index.js`, etc.) in the project.

    9.2. Copy the entire `inventory` folder along with its contents to your working branch (e.g., `main`).

10. Create the rewards folder and its service files to call the Rewards destination as in the `dev` branch:

    10.1. In dev branch, locate the `rewards` folder and its service files (`index.cds`, `index.js`, etc.) in the project.

    10.2. Copy the entire `rewards` folder along with its contents to your working branch (e.g., `main`).    

11. Deploy app to BTP

12.Configure SAP Build WOrkspace  

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

12. Build and deploy the CAP project. Once deployed, your CAP application, including notification setup and service integrations, will be live on SAP BTP.
13. Create a file called `notification-types.json` under `/srv` to define Notification types 

```json

[
    {
      "NotificationTypeKey": "rewards",
      "NotificationTypeVersion": "1",
      "Templates": [
        {
          "Language": "en",
          "TemplatePublic": "Sales Order",
          "TemplateSensitive": "Sales Order {{OrderNumber}} Update",
          "TemplateGrouped": "Sales Order {{OrderNumber}} Update",
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
      },
      {
        "NotificationTypeKey": "test",
        "NotificationTypeVersion": "1",
        "Templates": [
          {
            "Language": "en",
            "TemplatePublic": "Sales Order",
            "TemplateSensitive": "Sales Order {{OrderNumber}} Update",
            "TemplateGrouped": "Sales Order {{OrderNumber}} Update",
            "TemplateLanguage": "mustache",
            "Subtitle": "Tested"
          }
        ]
      }
  ]
  ```
14. Now refer this file in `package.json` under `cds.requires`

  ```
    "cds": {
    "requires": {
      "notifications": {
        "types": "srv/notification-types.json"
      },

  ```

15. Now these notifications are ready to be used. We have integrated an external service for rewards calculation. We can add a fiori notification after the rewards calculated.
    Create a new file under /lib/rewards-notification.js and paste below code

    ```js

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
```

16. Now we need to prepare the UI app to receive the notifications, UI application resides in the `/app` folder and will be deployed via mta deployment.
17. To enable access to the UI app needs to added the SAP Build Workspace