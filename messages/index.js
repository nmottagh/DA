/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/

// TODO: Clean up the hero card
// TODO: Update the help handler to include the wix 
// TODO: Take the picture as an attachement and put in the hero card

var deployment = "production";

"use strict";
var builder = require("botbuilder");
var path = require('path');
var useEmulator = (process.env.NODE_ENV == 'development');

if (deployment == "production") {
	var botbuilder_azure = require("botbuilder-azure");
	
	// Make sure you add code to validate these fields
	var luisAppId = process.env['LuisAppId'];
	var luisAPIKey = process.env['LuisAPIKey'];
	var luisAPIHostName = 'westus.api.cognitive.microsoft.com';

	var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
		appId: process.env['MicrosoftAppId'],
		appPassword: process.env['MicrosoftAppPassword'],
		stateEndpoint: process.env['BotStateEndpoint'],
		openIdMetadata: process.env['BotOpenIdMetadata']
	});

} else {
	var restify = require('restify');
	
	// Setup Restify Server
	var server = restify.createServer();
	server.listen(process.env.port || process.env.PORT || 3978, function () {
	   console.log('%s listening to %s', server.name, server.url); 
	});

	// Create chat connector for communicating with the Bot Framework Service
	var connector = new builder.ChatConnector({
		appId: process.env.MICROSOFT_APP_ID,
		appPassword: process.env.MICROSOFT_APP_PASSWORD
	});
	
	// Listen for messages from users 
	server.post('/api/messages', connector.listen());
}

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

var bot = new builder.UniversalBot(connector);

//Dialog with Luis
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
// Sample LUIS intent
.matches('greeting', (session) => {
        if (!session.userData.name) {
            session.beginDialog('/askName');
        } else {
            session.send("Welcome back " + session.userData.name + "!");
        }
})
.matches('request help', (session) => {
	if (session.userData.phonenumber) {
		session.send("OK. I understand you need help. An agent will call you at your phone number: " + session.userData.phonenumber); 
	} else {
		session.send("OK. I understand you need help. We would like to call you to help; however, we do not have your phone number on file. Please call us at 1-800-rlb-insrc"); 
	}
})
.matches('get coverage', (session) => {
	var msg = new builder.Message(session);
  var msg = new builder.Message(session)
    .addAttachment({
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
            type: "AdaptiveCard",
               body: [	{
					"type": "Container",
					"items": [
						{
							"type": "TextBlock",
							"text": "Your Coverage Summary",
							"weight": "bolder",
							"size": "large"
						},
						{
							"type": "ColumnSet",
							"columns": [
								{
									"type": "Column",
									"size": "auto",
									"items": [
										{
											"type": "Image",
											"url": "https://www.thepersonal.com/documents/11361124/11369861/icn_hub-carte-protections-auto-base.svg/ebd409a4-a7ab-4bd0-85a9-ef8f8f6f1560",
											"size": "small",
											"style": "person"
										},
										{
											"type": "TextBlock",
											"text": "Auto Insurance",
											"weight": "bolder",
											"size": "medium"
										},
										{
											"type": "TextBlock",
											"text": "Third Party Liability up to $1,000,000.00", 
											"wrap": "true"
										},
										{
											 "type": "TextBlock",
											 "text": "Collision up to $200,000,000.00",
											 "wrap": "true"
										},
										{
											"type": "TextBlock",
											"text": "Accident Benefits up to $1,000.00",
											"wrap": "true"
										}
									]
								},
									{
									"type": "Column",
									"size": "auto",
									"items": [
										{
											"type": "Image",
											"url": "https://www.thepersonal.com/documents/11361124/11369945/icn_zone-campagne-protections-habit.svg/b81a0e7c-d84c-4b83-adf7-6d197e46c56e",
											"size": "small",
											"style": "person"
										},
										{
											"type": "TextBlock",
											"text": "Home Insurance",
											"weight": "bolder",
											"size": "medium"
										},
										{
											"type": "TextBlock",
											"text": "Third Party Liability up to $1,000,000.00",
											"wrap": "true"
										}
									]
								}
							]
						}
					]
				}
			]
        }
    });
    session.send(msg).endDialog();
})
.matches('report accident', (session) => {
		session.send("OK, I understand you have been in an accident. Please start a claim.");
		session.beginDialog('/file a claim');
})
.matches('file a claim', (session) => {
	session.beginDialog('/file a claim');
})
.matches('Utilities.StartOver', (session) => {
	//session.reset();
})
.matches('Forget me', (session) => {
	session.userData.name = '';
	session.userData.phonenumber = '';
	session.send("I have erased your information.");
})
.onDefault((session) => {
    session.send('I am not sure what you said.');
});

bot.dialog('/', intents);  

var date;
var location;
var thirdparty;
var policereportno;

bot.dialog('/file a claim', [
    
	function (session) {
		builder.Prompts.text(session, "At what date did your accident occur?");
	}, 
	function (session, results, next) {
		date = results.response;
		next();
	},
	function (session){
		builder.Prompts.text(session, "Where did your accident occur?")
	},
	function (session, results, next){
		location = results.response;
		next();
	},
	function (session) {
		builder.Prompts.confirm(session, "Is a third party car or person involved?");
	},
	function (session, results, next) {
		if (results.response) {
			thirdparty = 'Yes';
		} else {
			thirdparty = 'No';
		}
		next();
	},
	function (session) {
		builder.Prompts.confirm(session, "Has a police report been filed?");
	}, 
	function (session, results, next) {
		if (results.response) {
			builder.Prompts.text(session, "Please enter your police report number.");
			next();
		} else {
			session.send("We will file your claim intake without a police report for now. Please ensure you update your claim with the police number once available.")
			next();
		}
	}, 
	function (session, results, next) {
		if (!results.response) {
			next();
		} else {
			policereportno = results.response;
			next();
		}
	},
	function (session) {
		builder.Prompts.attachment(session, "Please attach a picture.");
	},
	function (session, results) {
		var firstAttachment = results.response[0],
            msg = new builder.Message(session)
                .text("You sent a file of type %s and named %s",
                      firstAttachment.contentType, firstAttachment.name);
        msg.addAttachment(attachment);
        session.endDialog(msg);
	},
	function (session, args) {
        var message = new builder.Message(session);
        
        message.attachmentLayout(builder.AttachmentLayout.carousel);
        
        message.attachments([
            new builder.HeroCard(session)
                .title("Claim Information")
				.subtitle("Please verify the information and press submit to start your claim.")
                .text(date + location + thirdparty + policereportno)
                .images([builder.CardImage.create(session, 'https://dl.dropboxusercontent.com/s/lji8s8g67x8jjpq/PricewaterhouseCoopers_Logo.png?dl=0')])
                .buttons([
					 builder.CardAction.openUrl(session, 'https://docs.google.com/forms/d/e/1FAIpQLSdhc96iE-8_pbAKg5ejIsSBUlPkpTeEjkExUsG6wnx-gRSJRg/viewform?usp=pp_url&entry.2005620554=' + date +'&entry.1045781291=' + location + '&entry.1065046570=' + thirdparty + '&entry.1166974658=' + policereportno + '&entry.839337160', 'File a new claim')
                ])
            ]); 
		
        session.send(message);
		session.endDialog();
    }
]);

bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, "Hello! What is your name?");
    },
	function (session, results, next) {
        session.userData.name = results.response;
		next();
	},
	function (session) {
		builder.Prompts.text(session, "Hello " + session.userData.name + "! What is your phone number?");
	},
	function (session, results) {
		session.userData.phonenumber = results.response;
		session.endDialog("Welcome " + session.userData.name);
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
