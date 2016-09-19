$(function () {
    "use strict";
	console.log("Called frontend.js !");
    // for better performance - to avoid searching in DOM
    var content = $('#content');
    var input = $('#input');
    var status = $('#status');
	var errorSpan=$('#errorSpan');
    // my color assigned by the server
    var myColor = false;
    // my name sent to the server
    var myName = false;
	var group=false; // set the current group of user
	var radioPresent=false;
	var focusTextBox=document.getElementById("input");
   var errordiv= document.getElementById("errorBox"); // box to show errors 
    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

	
    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
                                    + 'support WebSockets.'} ));
        input.hide();
        $('span').hide();
        return;
    }

    // open connection
    var connection = new WebSocket('ws://127.0.0.1:1337');
    //var connection = new WebSocket('http://localhost:1337/');

    connection.onopen = function () {
        // first we want users to enter their names
        input.removeAttr('disabled');
        status.text('Choose name:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with conenction...
        content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
                                    + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        try {
            var json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
	/***
	detecting changes in dynamically generated radio button
	*/
	//$('input[name="yesbutton"]').change(function(){changeGroupUI($('input[name="yesbutton"]:checked').val())  });

	
        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json.type === 'color') { // first response from the server with user's color
            myColor = json.data;
            status.text(myName + ': ').css('color', myColor);
			/*connection.send("just joined the group");*/ //just joined group message;
            input.removeAttr('disabled').focus();
			
            // from now user can start sending messages
        } else if (json.type === 'history') { // entire message history
            // insert every single message to the chat window
            console.log("length of history is: "+json.data.length);
			for (var i=0; i < json.data.length; i++) {
				//if(json.data[i].group===group)
				{
				console.log("sending history to addMessage");
                addMessage(json.data[i].author, json.data[i].text,
                           json.data[i].color, new Date(json.data[i].time), json.data[i].group);
				}
            }
        } else if (myName!== false && group!== false && json.type === 'message') { // it's a single message
            input.removeAttr('disabled'); // let the user write another message
            addMessage(json.data.author	, json.data.text,
                       json.data.color, new Date(json.data.time),json.data.group);
        } else if(json.type === 'groupname') {
			var groupdiv=document.getElementById("groupdiv");
			var yes_button = makeRadioButton("yesbutton",json.data, json.data);
				groupdiv.appendChild(yes_button);
			
			var getgroup=$('input[name="yesbutton"]:checked').val(); // to know which group is user in
			group=getgroup;
			$("#content").append("<div id="+group+"></div>");
			changeGroupUI(group); // to only show messages of that group
			console.log("you are in group: "+ getgroup);
		}
		else if(json.type === 'joingroupname') {
			var groupdiv=document.getElementById("groupdiv");
			var yes_button = makeRadioButton("yesbutton",json.data, json.data);
				groupdiv.appendChild(yes_button);
			
			var getgroup=$('input[name="yesbutton"]:checked').val(); // to know which group is user in
			group=getgroup;
			
			$("#content").append("<div id="+group+"></div>");
			changeGroupUI(group); // to show the messages of only the group in focus
			//$("#content").append("<div id="+json.data+">hello world</div>")
			
			console.log("you are in group: "+ getgroup);
			console.log("join request received on front end");
		}
		else if(json.type==='error'){
			
			errordiv.style.visibility='visible';
			console.log("error: "+json.data);
			var h = document.createElement("H6");
			var t = document.createTextNode(json.data);
			//errordiv.appendChild(t);
			errorSpan.text(json.data);
            //errordiv.h;
		}
		else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json);
        }
    };

    /**
     * Send message when user presses Enter key
     */
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) {
                return;
            }
            // send the message as an ordinary text
			if(group!==false && myName!==false)
			{
            connection.send(group+"$&$"+msg);
			}
			else
			{
            connection.send(msg);
			}
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
           // input.attr('disabled', 'disabled'); *********************************************disabled
			errordiv.style.visibility='hidden';
            // we know that the first message sent from a user their name
            if (myName === false) {
                myName = msg;
            }
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */
    setInterval(function() {
        if (connection.readyState !== 1) {
            status.text('Error');
            input.attr('disabled', 'disabled').val('Unable to comminucate '
                                                 + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */
    function addMessage(author, message, color, dt, group) {
	
	
	//if(message!="just joined the group") // to check if its a joined message
	{
	if(author!==myName )  // receiving message from other users, they are displayed on the left
		{
		
        $('#'+group).prepend('<p id="'+group+'"><span style="color:' + color + '">' + author + '@ </span>  ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' +'<span style="border-radius:4px;background:'+color+';color:white;padding:5px">'+ message + '</span></p><br>');
		}
		else   //when active user inputs message its message is shown on the right
		{
			$('#'+group).prepend('<p id="'+group+'"align="right"><span style="color:' + color + '">' + author + '@ </span>  ' +
             + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
             + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
             + ': ' +'<span style="border-radius:4px;background:'+color+';color:white;padding:5px">'+ message + '</span></p><br>');
			 
		}
	}
	/*else
		{
		addJoinMessage();
		}*/
		 focusTextBox.focus();// to always keep the cursor inside the text box
	
    }
	
	
	
	// send the joining message, when any user connects
	function addJoinMessage(author, message, color) {
        content.prepend('<center><p><span style="border-radius:4px;background:'+color+';color:white;padding:5px"><b>'+ author +'</b>&emsp;'+ message + '</span></p><br></center>');
    }
	function makeRadioButton(name, value, text) {

    var label = document.createElement("label");
    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = name;
	radio.id = name;
	radio.checked=true; // to select the radio buttons
    radio.value = value;
	radio.onchange=checkRadioStatus;
    label.appendChild(radio);
	
    label.appendChild(document.createTextNode(text));
	
	radioPresent=true;
    return label;
  }
  
  /*$("input:radio[name=yesbutton]").change(function () {
    checkRadioStatus();*/

  
});

function changeGroupUI(group){
  $('#content').children().hide();
			$('#'+group).show();
  }
function showUI(group){
  //$('#content').children().hide();
			$('#'+group).show();
  }
  

function checkRadioStatus()
  {
  
	console.log($('input[name=yesbutton]:checked').val()); 
	changeGroupUI($('input[name=yesbutton]:checked').val());

  }