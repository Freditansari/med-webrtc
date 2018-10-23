/*
This code was developed by @ArinSime and AgilityFeat for an O'Reilly video course on WebRTC basics.  

You are welcome to use it at your own risk as starter code for your applications, 
but please be aware that this is not a complete code example with all the necessary 
security and privacy considerations implemented that a production app would require.  

It is for educational purposes only, and any other use is done at your own risk.
*/

//webrtc.js:  This is where we will put the bulk of the webrtc related code

io = io.connect();

var myName ="";
var theirName = "";
var myUserType ="";

var configuration ={
    'iceServers' : [{'url' : 'stun:stun.l.google.com:19302'}]
};

var rtcPeerConn;
var mainVideoArea = document.querySelector("#mainVideoTag");
var smallVideoArea = document.querySelector("#smallVideoTag");

var SIGNAL_ROOM ="signal_room";

io.on('signal', function(data){
    console.log(data);

    if(data.user_type =="doctor" && data.command == "joinroom"){
        console.log("doctor is here");

        if(myUserType =="patient"){
            theirName="Dr."+data.user_name;
            document.querySelector("#messageOutName").textContent = theirName;
            document.querySelector("#messageInName").textContent = myName;
        }
        document.querySelector("#requestDoctorForm").style.display = 'none';
        document.querySelector("#waitingForDoctor").style.display='none';
        document.querySelector("#doctorListing").style.display='block';
    }
    else if (data.user_type =="patient" && data.command == "calldoctor"){
        console.log("patient is calling");

        if(myUserType =="doctor"){
            theirName=data.user_name;
            document.querySelector("#messageOutName").textContent = theirName;
            document.querySelector("#messageInName").textContent = myName;
        }
        document.querySelector("#doctorSignup").style.display = 'none';
        document.querySelector("#videoPage").style.display = 'block';
    }
    else if(data.user_type =="signaling"){
        console.log('start doctor signaling...');
        if (!rtcPeerConn) startSignaling();
        
        var message = JSON.parse(data.user_data);

        if(message.sdp){
            rtcPeerConn.setRemoteDescription(new RTCSessionDescription(message.sdp), function(){
                if(rtcPeerConn.remoteDescription.type =='offer'){
                    rtcPeerConn.createAnswer(sendLocalDesc, logError);
                }
            },logError);

        }else{
            rtcPeerConn.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    }
});

function startSignaling(){
    displaySignalMessage("starting signaling..");

    rtcPeerConn = new webkitRTCPeerConnection(configuration);
    rtcPeerConn.onicecandidate=function(evt){
        if (evt.candidate)
        io.emit('signal',{"user_type":"signaling", "command":"icecandidate", "user_data": JSON.stringify({ 'candidate': evt.candidate })});
		console.log("completed sending an ice candidate...");
    };

    rtcPeerConn.onnegotiationneeded=function(){
        displaySignalMessage("on negotiation called");
        rtcPeerConn.createOffer(sendLocalDesc, logError);
    }

    rtcPeerConn.onaddstream = function(evt){
        displaySignalMessage("going to add their stream ...");
        mainVideoArea.src= URL.createObjectURL(evt.stream);
    };

     navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
     navigator.getUserMedia({'audio': true, 'video': true}, function(stream){ 
            displaySignalMessage("going to display my stream..");
            smallVideoArea.src = URL.createObjectURL(stream);
            rtcPeerConn.addStream(stream);
        },logError);
    
}

function sendLocalDesc(desc){
    rtcPeerConn.setLocalDescription(desc, function(){
        displaySignalMessage("sending local description");
        io.emit('signal',{"user_type":"signaling", "command":"SDP", "user_data": JSON.stringify({ 'sdp': rtcPeerConn.localDescription })});
    }, logError);

}

function logError(error){
    displaySignalMessage(error.name+': '+error.message);

}

function displaySignalMessage(message){
    // signalingArea.innerHTML=signalingArea.innerHTML + "<br/>"+ message;
    console.log(message);
}