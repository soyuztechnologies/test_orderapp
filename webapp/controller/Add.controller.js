sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], function (BaseController, JSONModel, Fragment, MessageBox, MessageToast) {
    "use strict";

    return BaseController.extend("mar.ab.zordmar.controller.Add", {

        onInit : function () {
            this.getRouter().getRoute("addorder").attachPatternMatched(this._onObjectMatched, this);
            //Step 1: Create a local json model for manipulation of data on UI
            var oLocalModel = new JSONModel();
            //Step 2: set the exact payload to the data
            oLocalModel.setData({
                orderData: {
                    "BuyerId": "",
                    "To_Items": [{
                        "ProductId": "",
                        "Note": "",
                        "CurrencyCode": "EUR",
                        "GrossAmount": "0.00",
                        "Quantity": "0",
                        "QuantityUnit": "EA"
                    }]
                }
            });
            //Set local model to the view as named model
            this.getView().setModel(oLocalModel, "order");
            //Set the local model as variable which can be used in another function
            this.oLocalModel = oLocalModel;

        },
        _onObjectMatched: function(){
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
        },
        onAddRow: function(){
            //Since its a local model which is suppling data to screen table
            //Its a json model with TwoWay binding, so we will add new row to json model
            //Step 1: Get all existing items
            var aItems = this.oLocalModel.getProperty("/orderData/To_Items");
            //Step 2: add a new blank record
            aItems.push({
                "ProductId": "",
                "Note": "",
                "CurrencyCode": "EUR",
                "GrossAmount": "0.00",
                "Quantity": "0",
                "QuantityUnit": "EA"
            });
            //Step 3: set data back to the model
            this.oLocalModel.setProperty("/orderData/To_Items", aItems);
        },
        oCustomerPopup: null,
        oProductPopup: null,
        oField: null,
        onItemSelect: function(oEvent){
            var sId = oEvent.getSource().getId();
            //1: get the object of the selected item by user
            var oSelItem = oEvent.getParameter("selectedItem");
            //2: Get the value from the list item
            var sText = oSelItem.getLabel();
            //3: Change the value back
            this.oField.setValue(sText);
        },
        onSave: function(){
            //Step 1: prepare the payload to be sent to SAP S/4HANA from local model
            var payload = this.oLocalModel.getProperty("/orderData");
            //Step 2: Validate data on UI
            if(payload.BuyerId === ""){
                MessageBox.error("please enter valid buyer Id");
                return;
            }
            payload.To_Items.forEach(element => {
                if(element.ProductId === ""){
                    MessageBox.error("Plase enter valid product Id");
                    return;
                }
            });
            //Step 3: get the OData model object
            var oDataModel = this.getView().getModel();
            //Step 4: Make deep insert - pass the create on odata model
            oDataModel.create("/OrderSet", payload, {
                success: function(data){
                    //Step 5: handle Response
                    var orderId = data.SoId;
                    MessageToast.show("The order " + orderId + " has been created successfully");
                },
                error: function(oErr){
                    //Step 5: handle Response   
                    MessageBox.error("Order creation has failed");
                }
            });

            

        },
        onProductHelp: function(oEvent){
            this.oField = oEvent.getSource();
            var that = this;
            if(!this.oProductPopup){
                Fragment.load({
                    id: "product",
                    controller: this,
                    name: "mar.ab.zordmar.fragments.popup"
                }).then(function(oDialog){
                    that.oProductPopup = oDialog;
                    that.getView().addDependent(that.oProductPopup);
                    that.oProductPopup.setTitle("Select Product");
                    that.oProductPopup.setMultiSelect(false);
                    that.oProductPopup.bindAggregation("items",{
                        path: '/ProductSet',
                        template: new sap.m.DisplayListItem({
                            label: '{PRODUCT_ID}',
                            value: '{NAME}'
                        })
                    });
                    that.oProductPopup.open();
                })
            }else{
                this.oProductPopup.open();
            }
        },
        onCustomerF4: function(oEvent){
            this.oField = oEvent.getSource();
            var that = this;
            if(!this.oCustomerPopup){
                Fragment.load({
                    id: "customer",
                    controller: this,
                    name: "mar.ab.zordmar.fragments.popup"
                }).then(function(oDialog){
                    that.oCustomerPopup = oDialog;
                    that.getView().addDependent(that.oCustomerPopup);
                    that.oCustomerPopup.setTitle("Select Customer");
                    that.oCustomerPopup.setMultiSelect(false);
                    that.oCustomerPopup.bindAggregation("items",{
                        path: '/SupplierSet',
                        template: new sap.m.DisplayListItem({
                            label: '{BP_ID}',
                            value: '{COMPANY_NAME}'
                        })
                    });
                    that.oCustomerPopup.open();
                })
            }else{
                this.oCustomerPopup.open();
            }
        },
        onDelRow: function(oEvent){
            //Step 1: Get the access of the row element from button
            var oLine = oEvent.getSource().getParent();
            //Step 2: Get the binding path /row/index
            var sIndex = oLine.getBindingContextPath();
            //Step 3: Extract the Index from the path
            sIndex = sIndex.split("/")[sIndex.split("/").length - 1];
            //Step 4: Load the items data from model
            var aItems = this.oLocalModel.getProperty("/orderData/To_Items");
            //Step 5: Delete the record with exact index
            aItems.splice(sIndex, 1);
            //Step 6: Set data back to the model (TwoWay, data change in model, reflect on UI)
            this.oLocalModel.setProperty("/orderData/To_Items", aItems);
        }

    });
});