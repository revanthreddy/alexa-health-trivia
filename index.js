

const Alexa = require('ask-sdk-core');
const dbService = require('./dynoservice');
const questions = require('./questions')

const WELCOME_MESSAGE = "Welcome to Novartis family health challenge. I will read you a question,\
                         and then ask you question based on that. Are you ready?";
const HELP_MESSAGE = "I will read you a question,\
and then ask you question based on that.";

const IN_PROGRESS = "IN_PROGRESS";

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === "LaunchRequest";
    },
    handle(handlerInput) {
        const speechOutput = WELCOME_MESSAGE;
        const repromptSpeechOutput = HELP_MESSAGE;
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(repromptSpeechOutput)
            .getResponse();
    }
};

const StoryHandler = {
    canHandle(handlerInput) {

        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === "IntentRequest" &&
            (request.intent.name === "StartStoryIntent" ||
                request.intent.name === "AMAZON.StartOverIntent" ||
                (request.intent.name === "AMAZON.YesIntent" && !attributes.gameState));
    },
    handle(handlerInput) {
        console.log("Story handler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return new Promise((resolve, reject) => {
            dbService.getPlayers("11111", function (err, players) {
                if (err) {
                    reject(handlerInput.responseBuilder
                        .speak("Rejecting")
                        .withShouldEndSession(false)
                        .getResponse())
                } else {
                    attributes.numberOfPlayers = players.length;
                    attributes.players = players;
                    attributes.counter = 1;
                    attributes.currentPlayer = players[attributes.counter - 1]["member_id"];
                    attributes.gameState = IN_PROGRESS;
                    handlerInput.attributesManager.setSessionAttributes(attributes);
                    let speech = "Is player " + attributes.currentPlayer + " present and ready?";
                    resolve( handlerInput.responseBuilder
                        .speak(speech)
                        .withShouldEndSession(false)
                        .getResponse())

                    // questions.getQuestion(attributes.currentPlayer, function (err, question) {
                    //     if (err) {
                    //         reject(handlerInput.responseBuilder
                    //             .speak("Rejecting")
                    //             .withShouldEndSession(false)
                    //             .getResponse())
                    //     } else {
                    //         attributes.currentQuestion = question;
                    //         handlerInput.attributesManager.setSessionAttributes(attributes);
                    //         resolve(handlerInput.responseBuilder
                    //             .speak(question["question"])
                    //             .withShouldEndSession(false)
                    //             .getResponse())
                    //     }
                    // });

                }
            });
        });

    }
};




const AnswerHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === "IntentRequest" &&
            request.intent.name === "AnswerIntent";
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        const answerSlot = handlerInput.requestEnvelope.request.intent.slots.answer.value;
        const currentQuestion = attributes.currentQuestion;
        const result = checkAnwser(answerSlot, currentQuestion);
        return new Promise((resolve, reject) => {
            if (result) {
                dbService.updateScoreOfTheMember("11111", attributes.currentPlayer, function (err, data) {
                    if (err) { //INTERNAL SERVER ERROR
                        reject(handlerInput.responseBuilder
                            .speak("Rejected. Please repeat")
                            .withShouldEndSession(true)
                            .getResponse())
                    } else {
                        let speech = "That is correct <break time='200ms'/>";
                        attributes.counter += 1;
                        if (attributes.counter > attributes.numberOfPlayers) {
                            resolve(handlerInput.responseBuilder
                                .speak(speech + " game complete")
                                .getResponse())
                        } else {
                            attributes.currentPlayer = attributes.players[attributes.counter - 1]["member_id"];
                            speech += "Is player "+attributes.currentPlayer+" present and ready?";
                            resolve(handlerInput.responseBuilder
                                .speak(speech)
                                .withShouldEndSession(false)
                                .getResponse());
                            
                        }

                    }
                });
            } else { //answer not correct
                let speech = "That is incorrect";
                attributes.counter += 1;
                if (attributes.counter > attributes.numberOfPlayers) {
                    resolve(handlerInput.responseBuilder
                        .speak(speech + " game complete")
                        .getResponse())
                } else {
                    attributes.currentPlayer = attributes.players[attributes.counter - 1]["member_id"];
                    handlerInput.attributesManager.setSessionAttributes(attributes);
                    speech += "Is player "+attributes.currentPlayer+" present and ready?";
                    resolve(handlerInput.responseBuilder
                        .speak(speech)
                        .withShouldEndSession(false)
                        .getResponse());

                }

            }
        });
    }
};


const FinalScoreHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === "IntentRequest" &&
            request.intent.name === "AnswerIntent" &&
            attributes.counter == attributes.storiesDeck.length - 1;
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return handlerInput.responseBuilder
            .speak(attributes.lastResult + " Thank you for playing Memory Challenge. Your final score is " + attributes.correctCount + " out of " + (attributes.counter + 1))
            .getResponse();
    }
};

const PlayerPresentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === "IntentRequest" &&
            request.intent.name === "AMAZON.YesIntent" && attributes.gameState === IN_PROGRESS;
    },
    handle(handlerInput) {
        console.log("PlayerPresentHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return new Promise((resolve, reject) => {
            questions.getQuestion(attributes.currentPlayer, function (err, question) {
                if(err){//INTERNAL SERVER ERROR
                    reject(handlerInput.responseBuilder
                        .speak("Internal server error")
                        .withShouldEndSession(true)
                        .getResponse())
                }else{
                    attributes.currentQuestion = question;
                    handlerInput.attributesManager.setSessionAttributes(attributes);
                    let speech = "Question for player "+attributes.currentPlayer+"<break time='200ms'/>";
                    speech += question["question"];
                    resolve(handlerInput.responseBuilder
                        .speak(speech)
                        .withShouldEndSession(false)
                        .getResponse());
                }
            });
        });        
    }

}


const PlayerNotPresentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === "IntentRequest" &&
            request.intent.name === "AMAZON.NoIntent" && attributes.gameState === IN_PROGRESS;
    },
    handle(handlerInput) {
        console.log("PlayerNotPresentHandler");
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        attributes.counter += 1;
        if (attributes.counter > attributes.numberOfPlayers) {
            return handlerInput.responseBuilder
                .speak("Ok, game complete")
                .withShouldEndSession(true)
                .getResponse();
        }else{
            attributes.currentPlayer = attributes.players[attributes.counter - 1]["member_id"];
            handlerInput.attributesManager.setSessionAttributes(attributes);
            let speech = "Is player "+attributes.currentPlayer+" present and ready?";
            return handlerInput.responseBuilder
                            .speak(speech)
                            .withShouldEndSession(false)
                            .getResponse()
            // return new Promise((resolve, reject) => {
            //     questions.getQuestion(attributes.currentPlayer, function (err, question) {
            //         if(err){//INTERNAL SERVER ERROR
            //             reject(handlerInput.responseBuilder
            //                 .speak("Internal server error")
            //                 .withShouldEndSession(true)
            //                 .getResponse())
            //         }else{
            //             attributes.currentQuestion = question;
            //             handlerInput.attributesManager.setSessionAttributes(attributes);
            //             let speech = "Question for player "+attributes.currentPlayer+"<break time='200ms'/>";
            //             speech += question["question"];
            //             resolve(handlerInput.responseBuilder
            //                 .speak(speech)
            //                 .withShouldEndSession(false)
            //                 .getResponse());
            //         }
            //     });
            // });
        }
        // return new Promise((resolve, reject) => {
        //     questions.getQuestion(attributes.currentPlayer, function (err, question) {
        //         if(err){//INTERNAL SERVER ERROR
        //             reject(handlerInput.responseBuilder
        //                 .speak("Internal server error")
        //                 .withShouldEndSession(true)
        //                 .getResponse())
        //         }else{
        //             let speech = "Question for player "+attributes.currentPlayer+"<break time='200ms'/>";
        //             speech += question["question"];
        //             resolve(handlerInput.responseBuilder
        //                 .speak(speech)
        //                 .withShouldEndSession(false)
        //                 .getResponse());
        //         }
        //     });
        // });        
    }

}

const TestHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return request.type === "IntentRequest" &&
            request.intent.name === "TestIntent";
    },
    handle(handlerInput) {
        const attributes = handlerInput.attributesManager.getSessionAttributes();
        return new Promise((resolve, reject) => {
            dbService.getPlayers("11111", function (err, players) {
                if (err) {
                    reject(handlerInput.responseBuilder
                        .speak("Rejecting")
                        .withShouldEndSession(false)
                        .getResponse())
                } else {
                    attributes.numberOfPlayers = players.length;
                    attributes.currentPlayer = players[0]["member_id"];
                    attributes.counter = 1;

                    questions.getQuestion(attributes.currentPlayer, function (err, question) {
                        if (err) {
                            reject(handlerInput.responseBuilder
                                .speak("Rejecting")
                                .withShouldEndSession(false)
                                .getResponse())
                        } else {
                            attributes.currentQuestion = question;
                            console.log(attributes);
                            handlerInput.attributesManager.setSessionAttributes(attributes);
                            resolve(handlerInput.responseBuilder
                                .speak(question["question"])
                                .withShouldEndSession(false)
                                .getResponse())
                        }
                    });

                }
            })
        });
    }
}


function getNextStory(handlerInput) {
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    var storiesDeck = [];

    if (!attributes.counter) { //skill launched for first time - no counter set
        storiesDeck = shuffle(stories);
        attributes.storiesDeck = storiesDeck;
        attributes.counter = 0;
        attributes.correctCount = 0;
        attributes.wrongCount = 0;
    }
    else {
        storiesDeck = attributes.storiesDeck;
    }

    const story = storiesDeck[attributes.counter];
    attributes.lastQuestion = story;
    handlerInput.attributesManager.setSessionAttributes(attributes);
    return story;
}



function checkAnwser(answer, questionObj) {
    if (questionObj["answer"].includes(answer)) {
        return true;
    } else
        return false;
}


const stories = [
    {
        "question": "Jeff loves sports. His favorite sports in the Olympics are ice skating and skiing for the Winter Olympics, and basketball and volleyball for the Summer Olympics. What are Jeffs favorite games for the Winter Olympics?", "answer": ["skating", "ice skating", "skiing"]
    },
    {
        "question": "While traveling, Samantha likes to take her tooth brush, hair brush, face cream, and hair dryer. What does Samantha like to carry when she travels?", "answer": ["tooth brush", "hair brush", "hair dryer", "face cream"]
    }
];

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        StoryHandler,
        AnswerHandler,
        FinalScoreHandler,
        TestHandler,
        PlayerPresentHandler,
        PlayerNotPresentHandler
    )
    .lambda();