using {
    managed,
    cuid
} from '@sap/cds/common';

namespace sap.sales.order;

entity Countries {
    key ID    : String(3);
        name  : localized String(255);
        descr : localized String(1000);
}

entity Currencies {
    key ID          : String(3);
        Description : localized String;
}

entity Customers {
    key ID   : String;
        Name : String;
}

entity Products{
  key ID   : UUID;
      Name : String;
}   



entity Header : managed, cuid {
    OrderNumber  : String(10) @readonly;
    Customer     : Association to one Customers;
    DeliveryDate : Date;
    OrderStatus  : String @default:'New';
    Description:String;
    Items        : Composition of many Items
                       on Items.Header = $self;
}

entity Items : cuid {
    OrderNumber    : String(8) @readonly;
    PositionNumber : Integer   @readonly;
    Product        : Association to one Products;

    @Semantics.amount.currencyCode   : 'Currency'
    Price          : Decimal(12, 2);

    @Semantics.currencyCode
    Currency       : Association to one Currencies;

    @Semantics.quantity.unitOfMeasure: 'unitOfMeasure'
    Quantity       : Decimal(16, 2);

    @Semantics.unitOfMeasure         : true
    unitOfMeasure  : String(4);
    Header         : Association to Header;
}
