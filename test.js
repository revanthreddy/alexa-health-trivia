const FAMILY_TABLE = "novartis_family_score"
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

var docClient = new AWS.DynamoDB.DocumentClient();
// var params = {};
// params.TableName = FAMILY_TABLE;
// params.Key = {
//     "family_id": "11111",
//     "member_id": "1"
// }

// docClient.get(params, function(err, data) {
//     if (err) {
//         console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
//     } else {
//         if(data["Item"])
//             console.log(data["Item"]);
//         else    
//             console.log({});
//     }
// });

var params = {
    TableName:FAMILY_TABLE,
    Key:{
        "family_id": "11111",
        "member_id": "1"
    },
    UpdateExpression: "set score = score + :val",
    ExpressionAttributeValues:{
        ":val": 1
    },
    ReturnValues:"UPDATED_NEW"
};
docClient.update(params, function(err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
    }
});  