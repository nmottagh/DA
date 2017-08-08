/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/

// TODO: Clean up the hero card
// TODO: Update the help handler to include the wix 
// TODO: Take the picture as an attachment and put in the hero card

var deployment = "non-production";

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
	
	// Make sure you add code to validate these fields
	var luisAppId = '';
	var luisAPIKey = '';
	var luisAPIHostName = 'westus.api.cognitive.microsoft.com';
	
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


bot.recognizer(recognizer);
bot.set('persistUserData', false);
bot.set('persistConversationData', false);

var intents = new builder.IntentDialog({ recognizers: [recognizer] })
// Sample LUIS intent
.matches('greeting', (session) => {
        if (!session.userData.name) {
            session.beginDialog('/askName');
        } else {
            session.beginDialog('/menu');
        }
})
.matches('show menu' , (session) => {
	session.beginDialog('/menu');
})
.matches('request help', (session) => {
	if (session.userData.phonenumber) {
		session.send("OK. I understand you need help. An agent will call you at your phone number: " + session.userData.phonenumber); 
	} else {
		session.send("OK. I understand you need help. We would like to call you to help; however, we do not have your phone number on file. Please call us at 1-800-rlb-insrc"); 
	}
})
.matches('get coverage', (session) => {
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
											"text": "Auto",
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
.matches('Forget me', (session) => {
	session.userData.name = '';
	session.userData.phonenumber = '';
	session.send("I have erased your information.");
})
.matches('startover', (session) => {
	session.beginDialog('/menu');
})
.onDefault((session) => {
    session.send('I am not sure what you said.');
});

bot.dialog('/', intents);  

// TODO: RESET SESSION VARIABLES
// TODO: FORCE TO NOT PERSIST SESSION DATA

var date;
var location;
var thirdparty;
var policereportno;
var photo;
var photourl = '';

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
		builder.Prompts.confirm(session, "Do you have a picture?");
	},
	function (session, results, next) {
		if (results.response) {
			builder.Prompts.attachment(session, "Please attach a picture.");
		}
		next();
	},
	function (session, results, next) {
		if (results.response) {
			photo = results.response[0];
			photourl = photo.contentUrl;
		}
		next();
	},
	function (session) {
		builder.Prompts.confirm(session, "Has a police report been filed?");
	}, 
	function (session, results, next) {
		if (results.response) {
			builder.Prompts.text(session, "Please enter your police report number.");
		} else {
			session.send("We will file your claim intake without a police report for now. Please ensure you update your claim with the police number once available.")
		}
		next();
	}, 
	function (session, results, next) {
		if (!results.response) {
			policereportno = "Not Provided";
		} else {
			policereportno = results.response;
		}
		next();
	},
	function (session, results, args) {
                  
		var message = new builder.Message(session)
		.addAttachment({
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
            type: "AdaptiveCard",
               body: [
				{
					"type": "ColumnSet",
					"columns": [
						{
							"type": "Column",
							"size": "auto",
							"items": [
								{
									"type": "Image",
									"size": "medium",
									"url": "https://dl.dropboxusercontent.com/s/lji8s8g67x8jjpq/PricewaterhouseCoopers_Logo.png?dl=0"
								},
								{
									"type": "TextBlock",
									"text": "Reliable Insurance Inc.",
									"size": "small",
									"isSubtle": true   
								}
							]
						},
						{
							"type": "Column",
							"size": "stretch",
							"items": [
								{
									"type": "TextBlock",
									"text": "Your Claim Summary",
									"horizontalAlignment": "right",
									"isSubtle": true
								},
								{
									"type": "TextBlock",
									"text": "NEW",
									"horizontalAlignment": "right",
									"size": "large",
									"color": "attention"
								}
							]
						}
					]
				},
				{
					"type": "ColumnSet",
					"separation": "strong",
					"columns": [
						{
							"type": "Column",
							"size": "stretch",
							"items": [
								{
									"type": "TextBlock",
									"text": "Date",
									"isSubtle": true
								},
								{
									"type": "TextBlock",
									"text": "Location"
								},
								{
									"type": "TextBlock",
									"text": "Involves Third Party"
								},
								{
									"type": "TextBlock",
									"text": "Police Report"
								}
							]
						},
						{
							"type": "Column",
							"size": "auto",
							"items": [
								{
									"type": "TextBlock",
									"text": date,
									"horizontalAlignment": "right",
									"isSubtle": true
								},
								{
									"type": "TextBlock",
									"text": location,
									"horizontalAlignment": "right"
								},
								{
									"type": "TextBlock",
									"text": thirdparty,
									"horizontalAlignment": "right"
								},
								{
									"type": "TextBlock",
									"text": policereportno,
									"horizontalAlignment": "right"
								}
							]
						}
					]
				},
				{
					"type":"Image",
					"url": photourl,
					"size": "auto",
					"horizontalAlignment" : "center"
				}
				], 
				"actions": [
					{
						"type": "Action.OpenUrl",
						"title": "File Your Claim",
						"url": "https://docs.google.com/forms/d/e/1FAIpQLSdhc96iE-8_pbAKg5ejIsSBUlPkpTeEjkExUsG6wnx-gRSJRg/viewform?usp=pp_url&entry.2005620554=" + date + "&entry.1045781291=" + location + "&entry.1065046570=" + thirdparty + "&entry.1166974658=" + policereportno + "&entry.839337160"
					}
				]
			}
		});
       	 
        session.send(message);
		session.endDialog();
    }
]);

bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, "Hello! Since this is the first time we are chatting, I need to know your name. What is your name?");
    },
	function (session, results, next) {
        session.userData.name = results.response;
		next();
	},
	function (session) {
		builder.Prompts.text(session, session.userData.name + ", what is your phone number?");
	},
	function (session, results) {
		session.userData.phonenumber = results.response;
		session.beginDialog('/menu');
	}
]);

bot.dialog('/menu', [
	function (session) {
		builder.Prompts.choice(session, "What can I help you with today :)?", "Check Coverage | File a Claim | Get Contact Info", {listStyle:3});
		session.endDialog();
	}
]);

bot.dialog('startover', [
	function (session) {
		session.send('OK! I can restart the conversation!');
		session.clearDialogStack();
		session.beginDialog('/menu');
	}
]).triggerAction({
    matches: 'startover',
    onSelectAction: (session, args, next) => {
        // Add the help dialog to the top of the dialog stack 
        // (override the default behavior of replacing the stack)
        session.beginDialog(args.action, args);
    }
});

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
