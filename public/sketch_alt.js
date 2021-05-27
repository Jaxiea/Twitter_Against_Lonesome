var socket = io.connect("https://localhost:443");  //'https://64.227.75.126:8080
var tweets = "no one's around yet...";
var historyTweets = [];
var txtPositionY = 0;     //(windowHeight - fontSize)
var fontSize = 32;
var currentLength = 12;
var error = [];
var historyTweetsToggle = false;
var errorMessage = "uh oh I didn't code this part, hang on..."
var errorToggle = false;
var lgth = 0;     //longest length
var modified_tweet;
var process_toggle = false;

var no = 0;


socket.on('tweet', function (data) {
  console.log("got tweets!");
  console.log(data);
  tweets = data;
  process_toggle = false;
});


socket.on('errormax', function (data) {
  console.log("Too many tries");
  errorToggle = true;
});



function setup() {
  var cnv = createCanvas(1280, 800);
  cnv.position(0, 0, 'absolute');
  cnv.parent('canvas');
  background(0);
  loadFont("Noto_Serif_TC/NotoSerifTC-Black.otf");
  txtPositionY = windowHeight/3;
  historyTweetsToggle == false;
  frameRate(5);
}



function draw(){
    background(0);
    fill(113, random(115, 255), 249);
    textSize(32);

    if (errorToggle){
        fill(113, random(115, 255), 249);
        textSize(fontSize);
        text(errorMessage, width/2 - textWidth(errorMessage)/2 + random(-1, 1), height/2);
        if (random(2)){
            background(0);
        }
    }
  //getting rid of links, ad block
    else if(tweets.search("https://") != -1 && process_toggle == false){
        modified_tweet = "an ad was blocked";
        process_toggle = true;
    }

   
    else if (tweets.search("\n") == -1 && process_toggle == false){
       //tweet is a straight line, and approapriate length
        if(textWidth(tweets) < width){
            lgth = textWidth(tweets);
            modified_tweet = tweets;
            process_toggle = true;
       }
        else{
            // Tweet is a straight line, but too long, replace , , .and space with \n
            tweets = line_breakdown(tweets);
            console.log(tweets);
        }
    }

    //Tweet has line breaks  
    if (tweets.search("\n") && process_toggle == false){

        //check if any segment is longer than width
        var tweet_array = tweets.split("\n");

        //get rid of extra \n
        for (var i = 0; i < tweet_array.length; i++){
            if(tweet_array[i] == "\n"){
                delete tweet_array[i];
            }
        }

        for (var i = 0; i < tweet_array.length; i++){
            if (textWidth(tweet_array[i]) > width){
                console.log("a segment is longer than the width");
                var tmp = tweet_array[i];
                tmp = line_breakdown(tmp);
                console.log("modified segment: ", tmp);
                tweet_array[i] = tmp;
            }
        }

        //get the width of the longest part
 
        var longest = tweet_array[0];
        lgth = 0;
        for (var i = 0; i < tweet_array.length; i++) {
            if (tweet_array[i].length > lgth) {
            lgth = tweet_array[i].length;
            longest = tweet_array[i];
            }
        }
        console.log("longest length is: ", lgth, longest);  

        lgth = textWidth(longest);

        console.log("longest final length is: ", lgth, width, (width - lgth)/2);  
        
        modified_tweet = tweets;
        process_toggle = true;
    }

    textSize(fontSize);
    text(modified_tweet, (width - lgth)/2, txtPositionY);
    fill(random(115, 255), 56, 227, 150);
    text(modified_tweet, (width - lgth)/2 + random(-3, 3), txtPositionY + random(-1, 1));
    fill(113, random(115, 255), 249);
  
}


function line_breakdown(line){
    line = line.replaceAll("，", "\n");
    line = line.replaceAll("！", "\n");
    line = line.replaceAll(" ", "\n");
    line = line.replaceAll("。", "\n");
    line = line.replaceAll("&amp;", "\n");
    line = line.replaceAll("、", "\n");
    line = line.replaceAll("？", "\n");
    return line;
}
