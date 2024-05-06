import spellings from './words.json';
let wordstodo = spellings.spell2;


let spellwords = [];
let speakbeast = new SpeechSynthesisUtterance();



function storeresult (storeobj, word, correct, spelling){
    if(storeobj[word]===undefined || storeobj[word]===null){
        storeobj[word] = {};
    }
    if(correct){
        if(storeobj[word].correct===undefined){
            storeobj[word].correct = [];
        }
        storeobj[word].correct.push(Date.now());
    } else {
        if(storeobj[word].wrong===undefined){
            storeobj[word].wrong = [];
        }
        storeobj[word].wrong.push(Date.now());

        if(storeobj[word].spellings===undefined){
            storeobj[word].spellings = {};
        }
        if(storeobj[word].spellings[spelling]===undefined){
            storeobj[word].spellings[spelling] = [];
        }
        storeobj[word].spellings[spelling].push(Date.now());
    }
}

function startspellings(numbertoadd = 20){
    let htmltext = "<div class='spellform'>";

    for(let i = 0;i<numbertoadd;i++){
        let wordok = false;
        while(!wordok){
            let randomnumber = Math.floor(Math.random() * wordstodo.length);
            let chosenword = wordstodo[randomnumber];
            if(!spellwords.includes(chosenword)){
                spellwords.push(chosenword);
                wordok = true;
                htmltext+=`<div> <button id="speak${i}">LISTEN</button> <input type=text id="${i}" autocomplete="off" spellcheck="false"/> </div>`;
            }
        }
    }

    htmltext+=`<div> <button id="endbutton">END</button> </div> </div>`;

    let thediv = document.getElementById("rootdiv");
    thediv.innerHTML = htmltext;

    let speakfuncs = [];

    for(let i = 0;i<numbertoadd;i++){
        speakfuncs.push( () => {
            window.speechSynthesis.cancel();
            speakbeast.text = spellwords[i];
            window.speechSynthesis.speak(speakbeast);
            document.getElementById(`${i}`).focus();
        });
        document.getElementById(`speak${i}`).addEventListener('click', speakfuncs[i]);
    }

    for(let i = 0;i<numbertoadd;i++){
        let thistextbox = document.getElementById(`${i}`);
        /*thistextbox.addEventListener("change", (event) => {
            console.log(event);
        });*/
        thistextbox.addEventListener("keypress", (event) => {
            event.target.value = event.target.value.toLowerCase().replace(/[^a-z]/gmi, "");
            if (event.key === "Enter"){
                if(i!==numbertoadd-1) {
                    speakfuncs[i+1]();
                } else {
                    window.speechSynthesis.cancel();
                    speakbeast.text = "Choose end when you're happy with your answers.";
                    window.speechSynthesis.speak(speakbeast);
                }
            }
        });
    }

    document.getElementById(`endbutton`).addEventListener('click', () => {
        let newhtmltext = "";
        let newscores = {};
        const previousscorestext = localStorage.getItem("tedsscores");
        if(previousscorestext){
            newscores = JSON.parse(previousscorestext);
            if(typeof(newscores)!=="object"){
                newscores = {};
            }
        }
        let score = 0;
        for(let i = 0;i<numbertoadd;i++){
            let tedsword = document.getElementById(`${i}`).value.replace(/\s/g, '');//remove spaces
            if(tedsword==""){
                window.speechSynthesis.cancel();
                speakbeast.text = "You've missed some! You rascal!";
                window.speechSynthesis.speak(speakbeast);
                return;
            }
            let definitelyright = spellwords[i].toLowerCase() == tedsword.toLowerCase();
            if(definitelyright){
                score++;
            }
            storeresult(newscores,spellwords[i],definitelyright,tedsword.toLowerCase());
            newhtmltext+=`<div>${spellwords[i]} - ${tedsword} - ${definitelyright?"GOOD!":" not quite.. "}</div>`;
        }
        newhtmltext+=`<div>${score}/${numbertoadd} correct!<div>`;
        newhtmltext+=`<div><button>RESTART</button><div>`;
        let thedivv = document.getElementById("rootdiv");
        thedivv.innerHTML = newhtmltext;
        localStorage.setItem("tedsscores", JSON.stringify(newscores));
        console.log(newscores);
    });

    window.speechSynthesis.cancel();
    speakbeast.text = "Hello!";
    window.speechSynthesis.speak(speakbeast);
}



function makestart(){
    document.getElementById("rootdiv").innerHTML = "<button id='startbutton'>Start!</button>";

    document.getElementById('startbutton').addEventListener('click', async () => {
         startspellings();
    });
}

makestart();
window.onbeforeunload = function () {return false;}
console.log(localStorage.getItem("tedsscores"));


//npx parcel this.html
//document.querySelector('button').addEventListener('click', async () => {startspellings();});
//document.querySelector('button').addEventListener('click', afunction);
//document.querySelector('button').removeEventListener('click', afunction);
//document.getElementById("rootdiv").innerHTML = "<button onclick='(() => {console.log(`meer`);})();' id='meerbutton'>Meer!</button>";
