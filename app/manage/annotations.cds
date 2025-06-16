using OrderService as service from '../../srv/order-service';

annotate service.Header with @(
    Common.SemanticKey           : ['OrderNumber'],
    UI.DeleteHidden              : {$edmJson: {$If: [
        {$Eq: [
            {$Path: 'OrderStatus'},
            'Submitted'
        ]},
        true,
        false
    ]}},
    UI.UpdateHidden              : {$edmJson: {$If: [
        {$Eq: [
            {$Path: 'OrderStatus'},
            'Submitted'
        ]},
        true,
        false
    ]}},
    UI.HeaderInfo                : {
        TypeName      : 'Sales Order',
        TypeNamePlural: 'Sales Orders',
        Title         : {
            $Type: 'UI.DataField',
            Value: OrderNumber
        },
        ImageUrl      : 'sap-icon://sales-order-item',
    },
    UI.Identification            : [{
        $Type            : 'UI.DataFieldForAction',
        Label            : 'Place Order',
        Action           : 'OrderService.submitOrder',
        // ![@UI.Hidden]    :{$edmJson: {$Eq: [{$Path: }, true]}} ,
        ![@UI.Importance]: #High,

    }],
    UI.FieldGroup #GeneratedGroup: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Label: '{i18n>customer}',
                Value: Customer_ID,
            },
            {
                $Type: 'UI.DataField',
                Label: '{i18n>deliverydate}',
                Value: DeliveryDate,
            },
            {
                $Type: 'UI.DataField',
                Label: '{i18n>description}',
                Value: Description,
            }
        ],
    },
    UI.Facets                    : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'GeneratedFacet1',
            Label : 'General Information',
            Target: '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Target: 'Items/@UI.LineItem',
            Label : 'Items',
            ID    : 'items',
        },
    ],
    UI.LineItem                  : [
        {
            $Type                : 'UI.DataField',
            Value                : OrderNumber,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : Customer_ID,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : DeliveryDate,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : Description,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                    : 'UI.DataField',
            Value                    : OrderStatus,
            Criticality              : StatusCriticality,
            CriticalityRepresentation: #WithIcon,
            ![@HTML5.CssDefaults]    : {width: '100%'}
        }
    ],
) {
    Description  @title       : '{i18n>description}';
    DeliveryDate @title       : '{i18n>deliverydate}';
    OrderNumber  @Common.Label: '{i18n>Ordernumber}';
    Customer     @(
        title           : '{i18n>customer}',
        Common.ValueList: {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'Customers',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: Customer_ID,
                    ValueListProperty: 'ID',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'Name',
                }
            ],
        }
    );
}

// annotate service.Header with {
//     Country @Common.ValueList: {
//         $Type         : 'Common.ValueListType',
//         CollectionPath: 'Countries',
//         Parameters    : [
//             {
//                 $Type            : 'Common.ValueListParameterInOut',
//                 LocalDataProperty: Country_ID,
//                 ValueListProperty: 'ID',
//             },
//             {
//                 $Type            : 'Common.ValueListParameterDisplayOnly',
//                 ValueListProperty: 'name',
//             },
//             {
//                 $Type            : 'Common.ValueListParameterDisplayOnly',
//                 ValueListProperty: 'descr',
//             },
//         ],
//     }
// };

annotate service.Items with @(

    Common.SemanticKey: [
        'OrderNumber',
        'PositionNumber'
    ],
    UI.HeaderInfo     : {
        TypeName      : 'Item',
        TypeNamePlural: 'Items',
        Title         : {
            $Type: 'UI.DataField',
            Value: PositionNumber
        }
    },
    UI.LineItem       : [
        {
            $Type                : 'UI.DataField',
            Value                : PositionNumber,
            ![@UI.Importance]    : #High,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : Product_ID,
            ![@UI.Importance]    : #High,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : Price,
            ![@UI.Importance]    : #High,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : Quantity,
            ![@UI.Importance]    : #High,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
        {
            $Type                : 'UI.DataField',
            Value                : unitOfMeasure,
            ![@UI.Importance]    : #High,
            ![@HTML5.CssDefaults]: {width: '100%'}
        },
    ]
) {
    Price         @(
        title               : '{i18n>price}',
        Measures.ISOCurrency: Currency_ID
    );
    Quantity      @title       : '{i18n>quantity}';
    OrderNumber   @Common.Label: '{i18n>Ordernumber}';
    unitOfMeasure @title       : '{i18n>unitOfMeasure}';
    Currency      @(Common.ValueList: {
        $Type         : 'Common.ValueListType',
        CollectionPath: 'Currencies',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: Currency_ID,
                ValueListProperty: 'ID',
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'Description',
            }
        ],
    });
    Product       @(
        title           : '{i18n>product}',
        Common.Text     : Product.Name,
        Common.ValueList: {
            $Type         : 'Common.ValueListType',
            CollectionPath: 'Products',
            Parameters    : [
                {
                    $Type            : 'Common.ValueListParameterInOut',
                    LocalDataProperty: Product_ID,
                    ValueListProperty: 'ID',
                },
                {
                    $Type            : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty: 'Name',
                }
            ],
        }
    );
};

annotate service.Header with actions {
    submitOrder @(
        Core.OperationAvailable            : {$edmJson: {$If: [
            {$Eq: [
                {$Path: 'in/OrderStatus'},
                'New'
            ]},
            true,
            false
        ]}},
        Common.SideEffects.TargetProperties: ['in/OrderStatus']
    );

};
