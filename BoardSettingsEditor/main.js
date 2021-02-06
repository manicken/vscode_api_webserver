
/**
 * node RED main - here the main entry function exist
 */
var RED = (function() { // this is used so that RED can be used as root "namespace"
	return {};
})();

RED.main = (function() {
    var settings = {
        WebServerPort:8080
    };
	var optionsCatContainerId;

    function SetButtonPopOver(buttonId, htmlText, location)
	{
		//console.error("setting popover for:" + buttonId + "  " + htmlText);
		if (location == undefined) location = "bottom";
		$(buttonId).mouseover(function() {
			showPopOver(buttonId, true, htmlText, location); // true means html mode
		});
		$(buttonId).mouseout(function() {
			$(this).popover("destroy");
		});
    }
    function showPopOver(rect, htmlMode, content,placement)
	{
		if (placement == null) placement = "top";
		current_popup_rect = rect;
		var options = {
			placement: placement,
			trigger: "manual",
			html: htmlMode,
			container:'body',
			rootClose:true, // failsafe
            content : content,
		};
		$(rect).popover(options).popover("show");
	}

	$(function()  // jQuery short-hand for $(document).ready(function() { ... });
	{	
        console.warn("main $(function() {...}) exec"); // to see load order

        var settingCatParams = {
            label:"Settings",
            expanded:true,
            popupText:"Board Settings",
            bgColor:"#FFFFFF",
            headerBgColor:"#AAAAAA",
            headerTextColor:"#000000",
            menuItems:undefined
        }
        var optionsCatParams = {
            label:"Options",
            expanded:true,
            popupText:"Board Options",
            bgColor:"#FFFFFF",
            headerBgColor:"#AAAAAA",
            headerTextColor:"#000000",
            menuItems:undefined
        }
        //$("#rootElement").append("hello world");

		var catContainerId = editor.createCategory(undefined, "leftPanel", "rootCategory", settingCatParams, true);
        
        var sdkOptions = { label:"SDK", type:"combobox", actionOnChange:true, options:["makefile", "platformio"], optionTexts:["Makefile", "PlatformIO"]};
        editor.createComboBoxWithApplyButton(catContainerId, "sdk", sdkOptions.label, sdkSelected, "teensy", "100%", sdkOptions);
        
        var platformOptions = { label:"Platform", type:"combobox", actionOnChange:true, options:["teensy", "arduino", "esp8266", "esp32", "stm32f1", "stm32f4"], optionTexts:["Teensy", "Arduino", "ESP8266 series", "ESP32 series", "STM32F1 series", "STM32F4 series"], popupText:"Note. Teensy is the only platform that have support for the Audio Nodes." };
        editor.createComboBoxWithApplyButton(catContainerId, "platform", platformOptions.label, platformSelected, "teensy", "100%", platformOptions);
        
        var boardOptions =  { label:"Board", type:"combobox", actionOnChange:true, options:["teensy30", "teensy40", "teensy41"], optionTexts:["Teensy 3.0", "Teensy 4.0", "Teensy 4.1"] , popupText:"Select Board"};
        editor.createComboBoxWithApplyButton(catContainerId, "board", boardOptions.label, boardSelected, "teensy40", "100%", boardOptions);
        
        optionsCatContainerId = editor.createCategory(undefined, catContainerId, "optionsCategory", optionsCatParams, true);



	});

    function sdkSelected(value) {
        httpGetAsync("cmd=ping", 
			function(rt) {
				//serverIsActive = true;
				console.log("serverIsActive " + rt);
			},
			function(st) {
				//serverIsActive = false;
				console.log("serverIsNotActive " + st);
			});
    }

    function platformSelected(value) {

    }

    function boardSelected(value) {

    }


    function httpPostAsync(data)
	{
		const t0 = performance.now();
		var xhr = new XMLHttpRequest();
		//console.warn("httpPostAsync:" + data);
		const url = 'http://localhost:' + settings.WebServerPort;
		xhr.open("POST", url, true);
		xhr.onloadend = function () {
			console.warn("response:" + xhr.responseText);
			const t1 = performance.now();
			console.log('httpPostAsync took: ' + (t1-t0) +' milliseconds.');
		  };
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.timeout = 2000;
		xhr.send(data); 
	}
	function httpGetAsync(queryString, cbOnOk, cbOnError)
	{
		var xmlHttp = new XMLHttpRequest();
		const url = 'http://localhost:' + settings.WebServerPort;
		xmlHttp.onreadystatechange = function () {
			if (xmlHttp.readyState != 4) return; // wait for timeout or response
			if (xmlHttp.status == 200)
			{
				if (cbOnOk != undefined)
					cbOnOk(xmlHttp.responseText);
				else
					console.warn(cbOnOk + "response @ " + queryString + ":\n" + xmlHttp.responseText);
			}
			else if (cbOnError != undefined)
				cbOnError(xmlHttp.status);
			else
				console.warn(queryString + " did not response = " + xmlHttp.status);
		};
		xmlHttp.open("GET", url + "?" + queryString, true); // true for asynchronous 
		xmlHttp.timeout = 2000;
		xmlHttp.send(null);
	}

	return {
		SetButtonPopOver:SetButtonPopOver
	};
})();
