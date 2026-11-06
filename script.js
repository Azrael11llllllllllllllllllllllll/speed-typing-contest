
const wrongCharacterSound=new Audio("https://www.myinstants.com/media/sounds/undertale-damage-taken.mp3");
wrongCharacterSound.preload="auto";
let previousTypingValue=typing.value;
const originalStartTypingRun=startTypingRun;
startTypingRun=function(){previousTypingValue="";originalStartTypingRun()};
const originalTypingInput=typing.oninput;
typing.oninput=function(){let value=typing.value,prefix=0,previousEnd=previousTypingValue.length,currentEnd=value.length;while(prefix<previousEnd&&prefix<currentEnd&&previousTypingValue[prefix]===value[prefix])prefix++;while(previousEnd>prefix&&currentEnd>prefix&&previousTypingValue[previousEnd-1]===value[currentEnd-1]){previousEnd--;currentEnd--;}if(running)for(let index=prefix;index<currentEnd;index++){if(value[index]!==passage[index]){wrongCharacterSound.currentTime=0;const playback=wrongCharacterSound.play();if(playback)playback.catch(error=>console.warn("Could not play the wrong-character sound.",error));break}}previousTypingValue=value;originalTypingInput()};
