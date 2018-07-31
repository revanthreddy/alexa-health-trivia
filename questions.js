


exports.getQuestion  = function(memberId ,callback){
    url= "http://52.91.138.129:8089/questions/"+memberId
    const stories = [
        {
            "question": "How many steps have you taken this week", "answer": ["200"]
        },
        {
            "question": "How many push ups did you do today?", "answer": ["55"]
        }
    ];

    
    callback(null , stories[Math.floor((Math.random() * stories.length))]);
}



exports.getGoals = function(callback){
    url= "http://52.91.138.129:8089/goals";
    var results = {
        "goals" : ["Steve is 20% to his goal" , "Mark completed his goal of 200 push ups"]
    }
    
    callback(null , results["goals"])
}