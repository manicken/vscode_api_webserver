// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
//import { IExtHostTerminalService } from './vs/workbench/api/common/extHostTerminalService';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';


import {NewMenuItem, NewMenu} from './Menu';

import { TestView } from './testView';


var Convert = require('ansi-to-html');
var convert = new Convert();
const stripAnsi = require('strip-ansi');

var webServer:Server;
var wsServer:Server;
const SettingFileName = "webServerApiSettings.json";
var webServerPort = 8080;
var webSocketPort = 3000;
var FilesDirectory = "DesignTool";
var useTerminalOutputCapture = true;
var useTerminalOutputToHtml = true;
var useTerminalOutputAnsiStrip = false;

var url = require('url');
var fs = require('fs');

import * as path from 'path';

//var midi = require('midi');

export function toHex(text:String){
    var hex, i;

    var result = "";
    for (i=0; i<text.length; i++) {
        hex = text.charCodeAt(i).toString(16);
        result += (" 000"+hex).slice(-4);
    }

    return result
}
//#region Terminal data write event https://github.com/microsoft/vscode/issues/78502
var _context: vscode.ExtensionContext;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	_context = context;
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('api-webserver.restart', () => {
		// The code you place here will be executed every time your command is executed
		StartExtension(context);		
	});
	StartExtension(context);
	context.subscriptions.push(disposable);
}
// this method is called when your extension is deactivated
export function deactivate() {
	webServer.close();
	
}

function getWebviewContent(rootDir:string) {
    //return fs.readFileSync(_context.extensionPath + "/manicken.github.io/index.html", {flag:'r'});
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0">
    <title>Board Manager</title>

    <link href="${rootDir}/BoardSettingsEditor/bootstrap/css/bootstrap.min.css" rel="stylesheet" media="screen">
    <link href="${rootDir}/BoardSettingsEditor/jquery/css/smoothness/jquery-ui-1.10.3.custom.min.css" rel="stylesheet" media="screen">
    <link rel="stylesheet" type="text/css" href="${rootDir}/BoardSettingsEditor/font-awesome/css/font-awesome.min.css"/>

    <link rel="stylesheet" href="${rootDir}/BoardSettingsEditor/style.css">
    </head>
    <body style="padding-left:0px">
    <script src="${rootDir}/BoardSettingsEditor/jquery/js/jquery-1.9.1.js"></script>
    <script src="${rootDir}/BoardSettingsEditor/bootstrap/js/bootstrap.min.js"></script>
    <script src="${rootDir}/BoardSettingsEditor/jquery/js/jquery-ui-1.10.3.custom.min.js"></script>
    <script src="${rootDir}/BoardSettingsEditor/jquery/js/jquery.ui.touch-punch.min.js"></script>
    <script src="${rootDir}/BoardSettingsEditor/main.js"></script>
    <script src="${rootDir}/BoardSettingsEditor/settings-editor.js"></script>´´
 
    <div id="leftPanel">
    
    </div>

    <div id="rightPanel">
    <textarea type="text" id="outputPreview" name="outputPreview" style="width: 95%; height: 95%"></textarea> 
    </div>


    </body>
    </html>`;
}

var panel:vscode.WebviewPanel;
var panelIsVisible = false;
export function ShowBoardSettings() {

    if (panelIsVisible == true) {
        vscode.window.showInformationMessage("panel visible");
        return;
    }
    // Create and show panel
    panel = vscode.window.createWebviewPanel(
        'boardSettings',
        'Board Settings',
        vscode.ViewColumn.One,
        {}
    );

    const resRootdir = panel.webview.asWebviewUri(vscode.Uri.file(_context.extensionPath)).toString();

    panel.onDidDispose(
        () => {
            panelIsVisible = false;
        },
        null,
        _context.subscriptions
    );
    console.warn(resRootdir);
    
    // And set its HTML content
    panel.webview.html = getWebviewContent(resRootdir);
    
    panel.webview.options = {enableCommandUris:true, enableScripts:true};
    panelIsVisible = true;
}

export function Build() {
    //vscode.window.showInformationMessage("build pressed");
    vscode.commands.executeCommand('platformio-ide.build');
}

export function Upload() {
    //vscode.window.showInformationMessage("upload pressed");
    vscode.commands.executeCommand('platformio-ide.upload');
}


export function InitMenu()
{
    NewMenu('apiWebServerMenu', [
        NewMenuItem("build", "Build", "Builds the current project", "check.svg", Build),
        NewMenuItem("upload", "Upload", "Upload to the board", "arrow-right.svg", Upload),
        NewMenuItem("boardSettings", "Board Settings", "Shows board settings", "adjustments.svg", ShowBoardSettings),
    ]);
}

export function StartExtension(context: vscode.ExtensionContext)
{
	loadSettings();

	InitMenu();
    ShowBoardSettings(); // development
    try{
	(<any>vscode.window).onDidWriteTerminalData((e: vscode.TerminalDataWriteEvent) => {
		//vscode.window.showInformationMessage(`onDidWriteTerminalData listener attached, check the devtools console to see events`);
		//console.log('onDidWriteData' + e.data);
		if (e.terminal.name != "Task - Build") return;

		if (webSocketClient == undefined) return;

		if (useTerminalOutputCapture)
			SendTerminalOutput(e.data);
	});
	vscode.window.showInformationMessage('api-webserver: special thanks for using --enable-proposed-api JannikSvensson.api-webserver');
	}
	catch (err)
	{
		vscode.window.showErrorMessage("error:" +err);
		vscode.window.showInformationMessage(err);
		vscode.window.showInformationMessage('api-webserver: Sorry onDidWriteTerminalData is not available in this mode, start code with: code --enable-proposed-api JannikSvensson.api-webserver');
	}

	/*try{
		const input = new midi.Input();

		// Count the available input ports.
		vscode.window.showInformationMessage("input.getPortCount()" + input.getPortCount());

		// Get the name of a specified input port.
		vscode.window.showInformationMessage("input.getPortName(0)" + input.getPortName(0));
	}
	catch (err)
	{
		vscode.window.showErrorMessage("error:" +err);
		vscode.window.showInformationMessage(err);
		vscode.window.showInformationMessage('sorry the midi interface is not availabe');
	}*/
	startServer();
	StartWebSocketServer();

	// Display a message box to the user
	if (webSocketClient != undefined)
		webSocketClient.send('Hello VS Code from API_WEBSERVER!');
	
	vscode.window.showInformationMessage('Congratulations, your extension "api-webserver" is now active!');
}
export function saveSettings(filePath:string)
{
	var cfg = {
		webServerPort:webServerPort, 
		webSocketPort:webSocketPort,
		FilesDirectory:FilesDirectory,
		useTerminalOutputCapture:useTerminalOutputCapture,
		useTerminalOutputAnsiStrip:useTerminalOutputAnsiStrip,
		useTerminalOutputToHtml:useTerminalOutputToHtml
	};
	fs.writeFile(filePath, JSON.stringify(cfg, null, 4), {flag:'wx'}, function(err:String) {
		if (err) return console.log(err);
		console.log('saved standard config file: ' + filePath);
	});
}
export function loadSettings()
{
	const folders = vscode.workspace.workspaceFolders
	if (folders == undefined) return "";
	var wsPath = folders[0].uri.fsPath; // gets the path of the first workspace folder
	wsPath += "/" + SettingFileName;
	if (!fs.existsSync(wsPath)){
		saveSettings(wsPath);
		return;
	}
	try { 
		var contents = fs.readFileSync(wsPath, {flag:'r'});
		var cfgIn = JSON.parse(contents);
		webServerPort = (cfgIn.webServerPort != undefined) ? cfgIn.webServerPort : webServerPort;
		webSocketPort = (cfgIn.webSocketPort != undefined) ? cfgIn.webSocketPort : webSocketPort;
		FilesDirectory = (cfgIn.FilesDirectory != undefined) ? cfgIn.FilesDirectory : FilesDirectory;
		useTerminalOutputCapture = (cfgIn.useTerminalOutputCapture != undefined) ? cfgIn.useTerminalOutputCapture: useTerminalOutputCapture;
		useTerminalOutputToHtml = (cfgIn.useTerminalOutputToHtml != undefined) ? cfgIn.useTerminalOutputToHtml : useTerminalOutputToHtml;
		useTerminalOutputAnsiStrip = (cfgIn.useTerminalOutputAnsiStrip != undefined) ? cfgIn.useTerminalOutputAnsiStrip : useTerminalOutputAnsiStrip;
		saveSettings(wsPath); // save back settings if there was anything added above
		console.log("read current settings");
	}
	catch (err)	{console.error(err);}
}
export function startServer()
{
	//create a server object:
	webServer = createServer(serverReq);
	
	webServer.listen(webServerPort); //the server object listens on port 8080
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
		var fileName:String = q.fileName;
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
		var path = GetFilesFolder();
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
	else if (q.cmd == "ping")
	{
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
		//console.log('POST req data:\n' + jsonString);
		var jsonObj= JSON.parse(jsonString);
		vscode.window.showInformationMessage('API webserver - set files');
		
		var wsPath = GetFilesFolder();
		if (wsPath.length == 0) return;
		
		if ((jsonObj.removeOtherFiles != undefined) && (jsonObj.removeOtherFiles == true))
		{
			vscode.window.showInformationMessage("removing unused files!");
			RemoveAllFilesInFolder(jsonObj.files, wsPath);
		}

		for (var i = 0; i < jsonObj.files.length; i++)
		{
			AddFile(wsPath, jsonObj.files[i]);
		}
	})
}
export function GetFilesFolder():String
{
	const folders = vscode.workspace.workspaceFolders
	if (folders == undefined) return "";
	var wsPath = folders[0].uri.fsPath; // gets the path of the first workspace folder
	wsPath += '/src/' + FilesDirectory;

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
	if (file.name.includes("..\\") || file.name.includes("../"))
		{
			console.log('AddFile: ' + path + '/' + file.name + 'Error file name cannot include ..\\ or ../');
			return;
		}
	fs.writeFile(path + '/' + file.name, file.contents, {flag:'w'}, function(err:String) {
		if (err) return console.log(err);
		console.log('AddFile: ' + path + '/' + file.name);
	});
}

var webSocketClient:WebSocket;
export function StartWebSocketServer()
{
	"use strict";

	const app = express(),
		wsServer = http.createServer(app),
		WebSocket = require("ws"),
		wss = new WebSocket.Server({ wsServer, port:webSocketPort });
	
	//when a websocket connection is established
	wss.on('connection', (wsc:WebSocket) => {
		webSocketClient = wsc;
		//connection is up, let's add a simple simple event
		wsc.on('message', (message:String) => {
			console.log("ws message:" + message);
			wsc.send('Hello, you sent -> ' + message + "<br>");
		});
		//send feedback to the incoming connection
		wsc.send('Hi there, I am a WebSocket server<br>');
	});
	
	//start the web server
	wsServer.listen(webSocketPort, () => {
		console.log(`Websocket server started on port ` + webSocketPort);
	});
}
export function SendTerminalOutput(data:String)
{
	var convertedStr = data;
	if (useTerminalOutputToHtml)
	{
		// because replace function don't "replace all"
		// the usage is split(search).join(replace)
		convertedStr = convertedStr.split("\x3c").join("&lt;");
		convertedStr = convertedStr.split("\x3e").join("&gt;");
		convertedStr = convertedStr.split("\r\n").join("<br>");
		convertedStr = convertedStr.split("\r").join("<br>");
		convertedStr = convertedStr.split("\n").join("<br>");
		convertedStr = convertedStr.split("\x20").join("&nbsp;");
		convertedStr = convertedStr.replace("n]0;", "<br>");
		if (useTerminalOutputAnsiStrip)
			convertedStr = stripAnsi(convertedStr);
		else
			convertedStr = convert.toHtml(convertedStr);
	}
	else if (useTerminalOutputAnsiStrip)
	{
		convertedStr = stripAnsi(convertedStr);
	}
	//else raw output
	webSocketClient.send(convertedStr);
}


