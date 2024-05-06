import spellings from './words.js';
let wordstodo = [...new Set([...spellings.y34, ...spellings.y56])];

let spellwords = [];
let speakbeast = new SpeechSynthesisUtterance();


function getscores(){
    let scores = {};
    const previousscorestext = localStorage.getItem("tedsscores");
    if(previousscorestext){
        scores = JSON.parse(previousscorestext);
        if(typeof(scores)!=="object"){
            scores = {};
        }
    }
    return scores;
}

function displayscoreshtml(){
    const scores = getscores();
    let scorearray = [];
    Object.entries(scores).forEach(([key, val]) => {
        let correct = 0;
        let wrong = 0;
        let percentage;
        let rightlasttime = true;
        let correcttime = 0;
        if(val.correct!==undefined){
            correct = val.correct.length;
            correcttime = val.correct[val.correct.length-1];
        }
        if(val.wrong!==undefined){
            wrong = val.wrong.length;
            let wrongtime = val.wrong[val.wrong.length-1];
            if(wrongtime>correcttime){
                rightlasttime = false;
            }
        }
        scorearray.push({ word:key, correct, wrong, percentage:(correct/(correct+wrong)*100), rightlasttime });
    });

    //sort it, worst at top
    scorearray.sort( (a,b) => {//neg=a first, pos=b first
        if(!a.rightlasttime){
            if(!b.rightlasttime){
                return a.percentage-b.percentage;//compare : a-b = lower numbers first
            } else {
                return -1;//a first
            }
        } else {
            if(!b.rightlasttime){
                return 1;//b first
            } else {
                return a.percentage-b.percentage;//compare
            }
        }
    } );


    let htmltext = "<div>";
    scorearray.forEach( element => {
        htmltext+=`<div>${element.word} `;
        htmltext+=`${element.percentage}% ${element.rightlasttime?"GREAT!":"Got wrong last time..."}`;
        htmltext+="</div>";
    })
    return htmltext+"</div>";
}

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


function addxwords(x,fromarray){
    let htmltext = "";
    for(let i = 0;i<x;i++){
        let wordok = false;
        while(!wordok){
            let randomnumber = Math.floor(Math.random() * fromarray.length);
            let chosenword = fromarray[randomnumber];
            if(!spellwords.includes(chosenword)){
                spellwords.push(chosenword);
                wordok = true;
                htmltext+=`<div> <button id="speak${i}">LISTEN</button> <input type=text id="${i}" autocomplete="off" spellcheck="false"/> </div>`;
            }
        }
    }
    return htmltext;
}

function startspellings(numbertoadd = 20){
    if(numbertoadd>wordstodo.length){
        //throw new Error("Too many words requested!");
        numbertoadd = wordstodo.length;
    }
    let totaladded = numbertoadd;
    const userdata = getscores();
    let neverseen = [];
    let neverright = [];
    //lowpercent? wronglasttime? todo.
    wordstodo.forEach( element => {
        if(userdata[element]===undefined){
            neverseen.push(element);
        } else {
            if(userdata[element].correct===undefined){
                neverright.push(element);
            }
        }
    });

    let htmltext = "<div class='spellform'>";
    
    let addunseen = numbertoadd;
    if(neverseen.length<addunseen){
        addunseen = neverseen.length;
    }
    htmltext+=addxwords(addunseen, neverseen);
    const lefttoadd = numbertoadd-addunseen;

    let addneverright = lefttoadd;
    if(neverright.length<addneverright){
        addneverright = neverright.length;
    }
    htmltext+=addxwords(addneverright, neverright);


    if(spellwords.length<totaladded){//fill it up with anything left.
        htmltext+=addxwords(totaladded-spellwords.length, wordstodo);
    }

    htmltext+=`<div> <button id="endbutton">END</button> </div> </div>`;

    let thediv = document.getElementById("rootdiv");
    thediv.innerHTML = htmltext;

    let speakfuncs = [];
    for(let i = 0;i<totaladded;i++){
        speakfuncs.push( () => {
            window.speechSynthesis.cancel();
            speakbeast.text = spellwords[i];
            window.speechSynthesis.speak(speakbeast);
            document.getElementById(`${i}`).focus();
        });
        document.getElementById(`speak${i}`).addEventListener('click', speakfuncs[i]);
    }

    for(let i = 0;i<totaladded;i++){
        let thistextbox = document.getElementById(`${i}`);
        /*thistextbox.addEventListener("change", (event) => {
            console.log(event);
        });*/
        thistextbox.addEventListener("keypress", (event) => {
            event.target.value = event.target.value.toLowerCase().replace(/[^a-z]/gmi, "");
            if (event.key === "Enter"){
                if(i!==totaladded-1) {
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
        let newscores = getscores();
        let score = 0;
        for(let i = 0;i<totaladded;i++){
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
        newhtmltext+=`<div>${score}/${totaladded} correct!<div>`;
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
    document.getElementById("rootdiv").innerHTML = "<button id='startbutton'>Start!</button><button id='scorebutton'>Scores</button>";

    document.getElementById('startbutton').addEventListener('click', async () => {
         startspellings();
    });
    document.getElementById('scorebutton').addEventListener('click', async () => {
        let htmlnewtext = displayscoreshtml();
        document.getElementById("rootdiv").innerHTML = htmlnewtext;
   });
}

makestart();
window.onbeforeunload = function () {return false;}
console.log(getscores());


//npx parcel this.html
//document.querySelector('button').addEventListener('click', async () => {startspellings();});
//document.querySelector('button').addEventListener('click', afunction);
//document.querySelector('button').removeEventListener('click', afunction);
//document.getElementById("rootdiv").innerHTML = "<button onclick='(() => {console.log(`meer`);})();' id='meerbutton'>Meer!</button>";

function download(content = JSON.stringify({"thing":"thingval"}), fileName = "blob", contentType = "application/binary") {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

function arraymerge(first, second){
    return [...new Set([...first, ...second])];
}

function arraycopyremovingfoundinarray(removefrom,removethese){
    return [...removefrom].filter( function( element ) {
        return !removethese.includes( element );
      } );
}
