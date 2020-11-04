// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
var webServer:Server;
var wsServer:Server;

const port = 8080;
var url = require('url');
var fs = require('fs');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "api-webserver" is now active!');
	vscode.window.showInformationMessage('Congratulations, your extension "api-webserver" is now active!');
	startServer();
	StartWebSocketServer();
	
	//vscode.window.onDidChangeActiveTerminal((e) => {console.log(e.)})

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('api-webserver.helloWorld', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		webSocketClient.send('Hello VS Code from API_WEBSERVER!');
		vscode.window.showInformationMessage('Hello VS Code from API_WEBSERVER!');
	});

	context.subscriptions.push(disposable);
}
export function startServer()
{
	//create a server object:
	webServer = createServer(serverReq);
	
	webServer.listen(8080); //the server object listens on port 8080
}
export function serverReq(req:IncomingMessage, res:ServerResponse)
{
	res.setHeader("Access-Control-Allow-Origin", "*");
	if (req.method == 'GET')
		serverReq_GET(req, res);
	else if (req.method == 'POST')
		serverReq_POST(req,res);
}
export function serverReq_GET(req:IncomingMessage, res:ServerResponse)
{
	var q = url.parse(req.url, true).query;
	
	res.writeHead(200, {'Content-Type': 'text/html'});
	if (q.cmd == "getFile")
	{
		var fileName:String = q.param;
		if (fileName == undefined || fileName == "")
		{
			res.write('getFile missing param="filename"');
			res.end();
			return;
		}
		// prevent directory traversal 
		if (fileName.includes("..\\") || fileName.includes("../"))
		{
			res.write('Error file name cannot include ..\\ or ../');
			res.end();
			return;
		}
		//fileName = fileName.replace("..\\", ""); 
		//fileName = fileName.replace("../", ""); // prevent directory traversal 
		console.log("getFile cmd:" + q.param)
		var path = GetDesignToolFolder();
		if (path.length != 0) {
			path += '/' + fileName;
			try {
			var contents:String = fs.readFileSync(path, {flag:'r'});
			res.write(contents);
			}
			catch (err)
			{
				console.error(err);
			}
		}
		res.end();
		return;
	}
	else if (q.cmd == "compile")
	{
		console.log("compile cmd:");
		vscode.commands.executeCommand('platformio-ide.build');
		res.write('OK');
		res.end();
		return;
	}
	else if (q.cmd == "upload")
	{
		console.log("upload cmd:");
		vscode.commands.executeCommand('platformio-ide.upload');
		res.write('OK');
		res.end();
		return;
	}
	res.write('unknown command' + req.url); //write a response to the client
	res.end(); //end the response
}
export function serverReq_POST(req:IncomingMessage, res:ServerResponse)
{
	const chunks:Uint8Array[] = [];
	
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('OK'); //write a response to the client
	res.end(); //end the response
	req.on('data', (chunk) => {chunks.push(chunk)});
	req.on('end', () => {
		var jsonString = Buffer.concat(chunks).toString();
		console.log('POST req data:\n' + jsonString);
		var jsonObj= JSON.parse(jsonString);
		vscode.window.showInformationMessage('API webserver - set files');
		
		var wsPath = GetDesignToolFolder();
		if (wsPath.length == 0) return;
		RemoveAllFilesInFolder(jsonObj.files, wsPath);
		for (var i = 0; i < jsonObj.files.length; i++)
		{
			AddFile(wsPath, jsonObj.files[i]);
		}
	})
}
export function GetDesignToolFolder():String
{
	const folders = vscode.workspace.workspaceFolders
	if (folders == undefined) return "";
	var wsPath = folders[0].uri.fsPath; // gets the path of the first workspace folder
	wsPath += '/src/DesignTool';

	if (!fs.existsSync(wsPath)){
		fs.mkdirSync(wsPath);
	}
	return wsPath;
}
export interface JSONfile
{
	name:String;
	contents:String
}
export function NameExistsIn(name:String, jsonFiles: JSONfile[]):boolean
{
	for (var i = 0; i < jsonFiles.length; i++)
	{
		if (jsonFiles[i].name == name)
			return true;
	}
	return false;
}
export function RemoveAllFilesInFolder(jsonFiles: JSONfile[], path: String)
{
	var files = fs.readdirSync(path);
	for (var i = 0; i < files.length; i++)
	{
		if (NameExistsIn(files[i], jsonFiles))
			continue;

		try {
			console.log("try remove file:" +path +'/' + files[i])
			fs.unlinkSync(path + '/' + files[i]);
		}
		catch (err)
		{
			console.error(err);
		}
	}

}
export function AddFile(path: String, file: JSONfile)
{
	fs.writeFile(path + '/' + file.name, file.contents, {flag:'wx'}, function(err:String) {
		if (err) return console.log(err);
		console.log('AddFile: ' + path);
	});
}

  var webSocketClient;
  export function StartWebSocketServer()
  {
	"use strict";

	const serverPort = 3000,
		http = require("http"),
		express = require("express"),
		app = express(),
		wsServer = http.createServer(app),
		WebSocket = require("ws"),
		websocketServer = new WebSocket.Server({ wsServer, port:3000 });
	
	//when a websocket connection is established
	websocketServer.on('connection', (_webSocketClient) => {
		webSocketClient = _webSocketClient;
		//send feedback to the incoming connection
		_webSocketClient.send('{ "connection" : "ok"}');
		
		//when a message is received
		_webSocketClient.on('message', (message) => {
	
			//for each websocket client
			websocketServer
			.clients
			.forEach( client => {
				//send the client the current message
				client.send(`{ "message" : ${message} }`);
			});
		});
	});
	
	//start the web server
	wsServer.listen(serverPort, () => {
		console.log(`Websocket server started on port ` + serverPort);
	});
  }

// this method is called when your extension is deactivated
export function deactivate() {
	webServer.close();
}
