/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var gui = require('gui');

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
            session.send("Hi " + session.userData.name + "!");


            var window = new gui.Window ({
                'title': 'node-gui',
                'window-position': 1,
                'opacity': 0.5
            });
            window.show ();
            next();
        }
    },
    function (session, results) {
        
        var message = new builder.Message(session);
        
        message.attachmentLayout(builder.AttachmentLayout.carousel);
        
        message.attachments([
            new builder.HeroCard(session)
                .title("RSA Group")
                //.subtitle("100% Soft and Luxurious Cotton")
                .text("Start a new claim process")
                .images([builder.CardImage.create(session, 'https://www.google.ca/url?sa=i&rct=j&q=&esrc=s&source=images&cd=&cad=rja&uact=8&ved=0ahUKEwjRybqxg8PUAhVQx2MKHc1fDF0QjRwIBw&url=http%3A%2F%2Fpress.pwc.com%2FNews-releases%2FPwC-Introduces-New-Branding-Initiative%2Fs%2F0b56b3ab-4176-4d9f-b47f-d09e02bebe17&psig=AFQjCNGKSlmcLzKxbJbUWQtHVqzuArPHKA&ust=1497725223290055')])
                .buttons([
                     builder.CardAction.imBack(session, "OK " + session.userData.name + " ,please click here to start a claim " + "https://www.rsagroup.ca/make-claim", "File a new claim")
                ])
            ]);
    
        session.send(message);
    },
    function (session, results) {
        session.userData.todoaction = results.response.entity;
       // session.send("OK " + session.userData.name + " ,please click here to start a claim " + "https://www.rsagroup.ca/make-claim");
        //if (session.userData.todoaction == "File a new claim"){
        //   session.send("OK " + session.userData.name + " Please click here to start a claim " + "https://www.rsagroup.ca/make-claim");
        //}
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
    module.exports = { default: connector.listen() }
}