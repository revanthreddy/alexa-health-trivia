

const FAMILY_TABLE = "novartis_family_score"
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });


exports.updateScoreOfTheMember = function (family_id, member_id, callback) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: FAMILY_TABLE,
        Key: {
            "family_id": family_id,
            "member_id": member_id
        },
        UpdateExpression: "set score = score + :val",
        ExpressionAttributeValues: {
            ":val": 1
        },
        ReturnValues: "UPDATED_NEW"
    };
    docClient.update(params, function (err, data) {
        if (err) {
            console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            callback(err, null)
        } else {
            console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
            callback(null, true)
        }
    });
}


// function getScore(family_id, member_id, callback) {
//     var docClient = new AWS.DynamoDB.DocumentClient();
//     var params = {};
//     params.TableName = FAMILY_TABLE;
//     params.Key = {
//         "family_id": family_id,
//         "member_id": member_id
//     }

//     docClient.get(params, function (err, data) {
//         if (err) {
//             console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
//         } else {
//             if (data["Item"]) {
//                 console.log(data["Item"]);
//                 callback(null, data["Item"]["score"])
//             }
//             else {
//                 console.log({});
//                 callback(null, {})
//             }
//         }
//     });

// };

exports.getPlayers = function (family_id, callback) {

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {};
    params.TableName = FAMILY_TABLE;
    params.IndexName = "family_id-index";
    params.KeyConditionExpression = 'family_id = :id',
        params.ExpressionAttributeValues = {
            ':id': family_id
        }


    docClient.query(params, function (err, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        } else {

            if (data["Items"]) {
                callback(null, data["Items"])
            } else {
                callback(null, {})
            }
        }
    });
}



exports.getData = function (id, callback) {
    setTimeout(function () {
        callback("Timed out data");
    }, 200)
}