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

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/', [
    function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/askName');
        } else {
            session.send("Welcome back " + session.userData.name + "!");
            next();
        }
    },
    function (session, results) {
        
        var message = new builder.Message(session);
        
        message.attachmentLayout(builder.AttachmentLayout.carousel);
        
        message.attachments([
            new builder.HeroCard(session)
                .title("Reliable & Accountable Insurance")
                .text("Start a new claim process")
                .images([builder.CardImage.create(session, 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/PricewaterhouseCoopers_Logo.svg/1185px-PricewaterhouseCoopers_Logo.svg.png')])
                .buttons([
                     builder.CardAction.openUrl(session, 'https://nmottagh.wixsite.com/reliableinsurance/claims', 'File a new claim')
                ])
            ]);
		
        session.send(message);
    },
	function (session){
		
		session.send ('OK,' + session.userData.name + 'I have directed you to the website to submit your claim!');
		session.endDialog();
		
	}
]);

bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
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
	var listener = connector.listen();
    var withLogging = function(context, req) {
        console.log = context.log;
        listener(context, req);
    }

    module.exports = { default: withLogging }
    // module.exports = { default: connector.listen() }
}