var socket = io.connect('https://64.227.75.126/Twitter_Against_Lonesome:3000'); //64.227.75.126/Twitter_Against_Lonesome
var tweets = [];
var historyTweets = [];
var txtPositionY = 30;     //(windowHeight - fontSize)
var fontSize = 18;
var currentLength = 12;
var newTweetSignal = false;
var error = [];
var historyTweetsToggle = false;
var errorMessage = "uh oh I didn't code this part, hang on..."
var errorToggle = false;

var no = 0;


socket.on('tweet', function (data) {
  console.log("got tweets!");
  console.log(data);
  tweets = data;
  newTweetSignal = true;
});

socket.on('search', function (data) {
  console.log("got history tweets!");
  if (data != historyTweets){
  historyTweets = data;
  }
});

socket.on('errormax', function (data) {
  console.log("Too many tries");
  errorToggle = true;
});



function setup() {
  var cnv = createCanvas(2500, 810);
  cnv.position(0, 0, 'absolute');
  cnv.parent('canvas');
  background(0);
  loadFont("Noto_Serif_TC/NotoSerifTC-ExtraLight.otf");
  historyTweetsToggle == false
}



function draw(){
  fill(113, random(115, 255), 249);
//  stroke(127, 63, 120);
  
  //console.log(historyTweets.length);
  
  if (errorToggle){
    fill(113, random(115, 255), 249);
    textSize(fontSize);
    text(errorMessage, width/2 - textWidth(errorMessage)/2 + random(-1, 1), height/2);
    if (random(2)){
      background(0);
    }
  }
  else{
    if (historyTweets && historyTweets.length > 0 && historyTweetsToggle == false && historyTweets.search("https://") == -1){
      console.log("here!");
      console.log(historyTweets);
      textSize(fontSize);
    
  
      for (var j = 0; j < historyTweets.length; j++){
        fill(113, random(115, 255), 249);
        text(historyTweets[j], 10 + map(noise(no), 0, 1, 0, width/25), txtPositionY);
        txtPositionY += ( fontSize + 4 );
        no += 0.05;
      }
      
      historyTweetsToggle = true;
    }
  
    if (tweets.length > 0 && newTweetSignal == true && tweets.search("https://") == -1){
      tweets = tweets.replaceAll('\n', ' ');
      textSize(fontSize);
  
      let start_po = map(noise(no), 0, 1, 0, width/25);
      //if (textWidth(tweets) + start_po < (width - 10)){
        text(tweets, 10 + start_po, txtPositionY);
      //}
      //else{
        //...
      //}
      
  
      txtPositionY += ( fontSize + 4 );
      newTweetSignal = false;
      no += 0.05;
    }
  
    if (txtPositionY > height) {
      background(0);
      txtPositionY = 48;
    }
  }
}
