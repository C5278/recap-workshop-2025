service InventoryService {
    event updateStock {
        orderNumber : String;
        userID      : String;
        payload     : String;
    }
}
