using {recap.sales.order as so} from '../db/schema';

service OrderService {
    @odata.draft.enabled
    entity Header     as
        projection on so.Header {
            *,
            case OrderStatus
                when
                    'Submitted'
                then
                    3
                else
                    5
            end as StatusCriticality :Integer
           
        }
        actions {
            action submitOrder() returns Header
        };

    entity Items      as projection on so.Items;
    entity Currencies as projection on so.Currencies;
    entity Countries  as projection on so.Countries;
    entity Customers  as projection on so.Customers;
    entity Products   as projection on so.Products;
}
