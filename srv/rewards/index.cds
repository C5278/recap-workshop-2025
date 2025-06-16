service RewardService {
    event updateRewards {
        orderNumber : String;
        userID      : String;
        payload     : String;
    }
}
