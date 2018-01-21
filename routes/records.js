var AWS = require('aws-sdk');
var uuid = require('node-uuid');

//loading aws credentials from config file
AWS.config.loadFromPath('./config.json');

//api version used for dynamoDB
dynamoDb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

//To change the response of DynamoDB into JSON format 
var parse = AWS.DynamoDB.Converter.output;

//The Name of the table in DynamoDB in which data is to be sent
var tableName = 'DHTSensorData';

//API used for listing the table contents of DynamoDB
exports.list = function(req, res){

    var queryParam = {
        TableName: tableName
    };

    
    dynamoDb.scan(queryParam, onScan);
    function onScan(err, data) {
        if (err) {
            console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            var result = [];
            data.Items.forEach(function(itemdata) {
                result.push(parse({ "M": itemdata}))
            });
            res.render('records',{page_title:"DynamoDb-All Records", data:result});
        }
    }
};

//To redirect to the /records/add_record page as it is the home page
exports.add = function(req, res){
  res.render('add_record',{page_title:"DynamoDb-Add Record"});
};

//Used for saving the data in database
exports.save = function(req,res){
    //convertToDynamoJson used to change the Json Data to DynamoDB readable format 
    var data = convertToDynamoJson(JSON.parse(JSON.stringify(req.body)))
    dynamoDb.putItem(data, function(err, data) {
        if (err) {
            console.log("Error", err);
            res.redirect('/records');
        }
            res.redirect('/records');
    });
};

//This fetches the data of the saved item for further edit
exports.edit = function(req, res){

    var result = [];
    var id = req.params.id;
    var getParams = {
        TableName: tableName,
        Key: {
            'id': {S: id}
        }
    };

    dynamoDb.getItem(getParams, function(err, data1) {
    if (err) {
        console.log("Error", err);
    }
    result.push(parse({ "M": data1.Item}))
    res.render('edit_record',{page_title:"DynamoDb-Edit Record", data: result});
 });
};

//To save the new edited data by user
exports.save_edit = function(req,res){
    
    var input = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id;

    var saveParam = {
        TableName: 'records',
        Key: {
            id: {
                'S': id
            }
        },
        UpdateExpression: 'SET #longitude =:longitude, #latitude= :latitude, #humidity =:humidity, #temperature =:temperature',
        ExpressionAttributeNames: {
            '#logitude': 'longitude',
            '#latitude': 'latitude',
            '#humidity':'humidity',
            '#temperature':'temperature'
        },
        ExpressionAttributeValues: {
            ':longitude': {
                'S': input.logitude    
            },
            ':latitude': {
                'S': input.latitude
            },
            ':humidity': {
                'N': input.humidity
            },
            ':temperature': {
                'N': input.temperature
            }
        }
    };
    dynamoDb.updateItem(saveParam, function(err, data) {
        if (err) {
            console.log('Error :' + err);
            res.redirect('/records');
        }
        res.redirect('/records');
    });
};

//to delete the existing records
exports.delete_record = function(req,res){
          
    var id = req.params.id;
    var deleteParams = {
        TableName: tableName,
        Key: {
            'id': {S: id}
        }
    };

    dynamoDb.deleteItem(deleteParams, function(err, data) {
        if (err) {
            console.log("Error", err);

            res.redirect('/records');
        }
        res.redirect('/records');
    });
};

//Function written to convert JSON format data into data format which is excepted by DynamoDB
function convertToDynamoJson(input) {
    return  {
        TableName: 'DHTSensorData',
        Item: {
            id: {
                S: uuid.v1()     //unique identity given to every Sensor Registered
            },
            longitude: {
                S: input.longitude
            },
            latitude: {
                S: input.latitude
            },
            humidity: {
                N: input.humidity
            },
            temperature: {
                N: input.temperature
            }
        }
    };
}
