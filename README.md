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
We have a order processing service, which takes an order request and then create the order in the system. 
You may find the UI app in the app folder, entities in the db folder, and service implementation in the srv folder.

## What are we going to do?
We are going to enhance this service by adding a rewards program and a inventory update service. These are independent services are can be invoked asynchronously on order creation event.
This use case is an example of outbox pattern, where remote operations are deferred until the main transaction has been successfully committed. This prevents accidental execution of remote calls in case the transaction is rolled back.

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
   npm install
   cds build
   cds watch

6. Add the **Submit Order** functionality:

   6.1. In the `dev` branch, open the `srv/order-service.js` file and copy the handler:

   ```javascript
        this.on('submitOrder', async (req) => {
            ....
        });
      

7. Copy the **Outbox** configuration from `package.json`:
    ```json
      "outbox": {
        "kind": "persistent-outbox",
        "maxAttempts": 20,
        "chunkSize": 100,
        "storeLastError": true,
        "parallel": true
      },
      
8. Copy the Inventory destination configuration from `package.json`:

   8.1. In the `dev` branch, open the `package.json` file.

   8.2. Locate the Inventory destination configuration under the `cds.requires` section. It typically looks like this:

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

   8.3. Copy the entire `Inventory` config.

9. Copy the Rewards destination configuration from `package.json`:

   9.1. In the `dev` branch, open the `package.json` file.

   9.2. Locate the Rewards destination configuration under the `cds.requires` section. It typically looks like this:

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

   9.3. Copy the entire `Rewards` configuration block.

   9.4. Open `package.json` in your working branch and paste the `Rewards` configuration inside.

10. Create the inventory folder and its service files to call the Inventory destination as in the `dev` branch:

    10.1. In dev branch, locate the `inventory` folder and its service files (`index.cds`, `index.js`, etc.) in the project.

    10.2. Copy the entire `inventory` folder along with its contents to your working branch (e.g., `main`).

11. Create the rewards folder and its service files to call the Rewards destination as in the `dev` branch:

    11.1. In dev branch, locate the `rewards` folder and its service files (`index.cds`, `index.js`, etc.) in the project.

    11.2. Copy the entire `rewards` folder along with its contents to your working branch (e.g., `main`).     

12. Add **Notification configuration** to the project:

    12.1. In the terminal, run the following command to add the notifications module to your CAP project:
           
    ```bash
    cds add notifications            
    ```
    12.2. This command will automatically:

    - Add necessary dependencies "@cap-js/notifications" (if missing).
    - Add the following module definition (typically in `mta.yaml`) to enable notification content deployment during          deployment time:

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

13. Build and deploy the CAP project. Once deployed, your CAP application, including notification setup and service integrations, will be live on SAP BTP.

   
