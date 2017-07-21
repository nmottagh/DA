/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// Make sure you add code to validate these fields
var luisAppId = process.env['LuisAppId'];
var luisAPIKey = process.env['LuisAPIKey'];
var luisAPIHostName = 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

var bot = new builder.UniversalBot(connector);

//Dialog with Luis
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
// Sample LUIS intent
.matches('gretting', (session, args) => {
    session.beginDialog('/');
});

bot.dialog('/', intents);  

bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/askName');
        } else {
            session.send("Welcome back " + session.userData.name + "!");
            next();
        }
    },
    function (session, args, next) {
        
        var message = new builder.Message(session);
        
        message.attachmentLayout(builder.AttachmentLayout.carousel);
        
        message.attachments([
            new builder.HeroCard(session)
                .title("Reliable & Accountable Insurance")
                .text("Start a new claim process")
                .images([builder.CardImage.create(session, 'https://dl.dropboxusercontent.com/s/lji8s8g67x8jjpq/PricewaterhouseCoopers_Logo.png?dl=0')])
                .buttons([
                     builder.CardAction.openUrl(session, 'https://nmottagh.wixsite.com/reliableinsurance/claims', 'File a new claim')
                ])
            ]); 
		
        session.send(message);
    }

]);

bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, 'Hello! What is your name?');
    },
    function (session, results) {
        session.userData.name = results.response;
        session.endDialog();
    }
]);


if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
	
	/*var listener = connector.listen();
    var withLogging = function(context, req) {
        console.log = context.log;
        listener(context, req);
    }*/
    module.exports = { default: connector.listen() }
}
