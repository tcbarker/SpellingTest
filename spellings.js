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

function getwordscoredata(key, val){
    if(val===undefined){throw new Error("passed undefined score word");}
    let correct = 0;
    let wrong = 0;
    let wronglasttime = true;
    let lastseen = 0;
    if(val.wrong!==undefined){
        wrong = val.wrong.length;
        lastseen = val.wrong[val.wrong.length-1];
    }
    if(val.correct!==undefined){
        correct = val.correct.length;
        const correcttime = val.correct[val.correct.length-1];
        if(lastseen<correcttime){
            wronglasttime = false;
            lastseen = correcttime;
        }
    }
    const total = correct+wrong;
    return{ word:key, correct, wrong, total, percentage:(correct/total*100), wronglasttime, lastseen };
}



function displayscoreshtml(){
    const scores = getscores();
    let scorearray = [];
    Object.entries(scores).forEach(([key, val]) => {
        scorearray.push(getwordscoredata(key,val));
    });

    //sort it, worst at top
    scorearray.sort( (a,b) => {//neg=a first, pos=b first
        if(a.wronglasttime){
            if(b.wronglasttime){
                return a.percentage-b.percentage;//compare : a-b = lower numbers first
            } else {
                return -1;//a first
            }
        } else {
            if(b.wronglasttime){
                return 1;//b first
            } else {
                return a.percentage-b.percentage;//compare
            }
        }
    } );

    let htmltext = "<div>";
    scorearray.forEach( element => {
        htmltext+=`<div>${element.word} `;
        htmltext+=`${element.percentage}% ${!element.wronglasttime?"GREAT!":"Got wrong last time..."}`;
        htmltext+="</div>";
    })
    return htmltext+"</div>";
}

function storeresult (storeobj, word, correct, spelling, Datenow){
    if(storeobj[word]===undefined || storeobj[word]===null){
        storeobj[word] = {};
    }
    if(correct){
        if(storeobj[word].correct===undefined){
            storeobj[word].correct = [];
        }
        storeobj[word].correct.push(Datenow);
    } else {
        if(storeobj[word].wrong===undefined){
            storeobj[word].wrong = [];
        }
        storeobj[word].wrong.push(Datenow);

        if(storeobj[word].spellings===undefined){
            storeobj[word].spellings = {};
        }
        if(storeobj[word].spellings[spelling]===undefined){
            storeobj[word].spellings[spelling] = [];
        }
        storeobj[word].spellings[spelling].push(Datenow);
    }
}


function addxwords(x,fromarray){
    let htmltext = "";
    const startpos = spellwords.length;
    for(let i = 0;i<x;i++){
        let wordok = false;
        while(!wordok){
            let randomnumber = Math.floor(Math.random() * fromarray.length);
            let chosenword = fromarray[randomnumber];
            if(!spellwords.includes(chosenword)){
                spellwords.push(chosenword);
                wordok = true;
                htmltext+=`<div> <button id="speak${i+startpos}">LISTEN</button> <input type=text id="${i+startpos}" autocomplete="off" spellcheck="false"/> </div>`;
            }
        }
    }
    return htmltext;
}


function addsome(howmanylefttoadd, fromwhere){
    let addthismany = fromwhere.length<howmanylefttoadd?fromwhere.length:howmanylefttoadd;
    let htmltext = addxwords(addthismany, fromwhere);
    return{lefttoadd:howmanylefttoadd-addthismany, htmltext};
}



function startspellings(numbertoadd = 20){
    if(numbertoadd>wordstodo.length){
        numbertoadd = wordstodo.length;
    }
    spellwords = [];
    let totaladded = numbertoadd;
    const userdata = getscores();
    let neverseen = [];
    let neverright = [];
    let wronglasttime = [];
    let wordsdata = [];
    wordstodo.forEach( element => {
        if(userdata[element]===undefined){
            neverseen.push(element);
        } else {
            if(userdata[element].correct===undefined){
                neverright.push(element);
            } else {
                const worddata = getwordscoredata(element,userdata[element]);
                if(worddata.wronglasttime){
                    wronglasttime.push(element);
                } else {
                    wordsdata.push(worddata);
                }
            }
        }
    });

    let htmltext = "<div class='spellform'>";

    let added = addsome(numbertoadd, neverseen);
    htmltext+=added.htmltext;
    added = addsome(added.lefttoadd, neverright);
    htmltext+=added.htmltext;    
    added = addsome(added.lefttoadd, wronglasttime);
    htmltext+=added.htmltext;
    
    console.log(wordsdata);
    let leastseen = [];
    let lowestpercents = [];
    let oldestseen = [];
    //make groups from wordsdata, todo.


    htmltext+=addsome(added.lefttoadd, wordstodo).htmltext;

    htmltext+=`<div><button id="endbutton">END</button></div> </div>`;

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
        const Datenow = Date.now();
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
            storeresult(newscores,spellwords[i],definitelyright,tedsword.toLowerCase(),Datenow);
            newhtmltext+=`<div>${spellwords[i]} - ${tedsword} - ${definitelyright?"GOOD!":" not quite.. "}</div>`;
        }
        newhtmltext+=`<div>${score}/${totaladded} correct!</div>`;
        newhtmltext+=`<details><summary>Restart</summary><button id='restartbutton'>RESTART</button></details>`;
        let thedivv = document.getElementById("rootdiv");
        thedivv.innerHTML = newhtmltext;
        localStorage.setItem("tedsscores", JSON.stringify(newscores));
        console.log(newscores);
        document.getElementById('restartbutton').addEventListener('click', async () => {
            makestart();
        });
    });

    window.speechSynthesis.cancel();
    speakbeast.text = "Hello!";
    window.speechSynthesis.speak(speakbeast);
}

function exportsave(){
    download(JSON.stringify(getscores()), "SpellingsUserDataBackup.json");
}


function makestart(){
    document.getElementById("rootdiv").innerHTML = "<button id='startbutton'>Start!</button><details><summary>Options</summary><button id='scorebutton'>Scores</button><button id='exportbutton'>Export</button></details>";

    document.getElementById('startbutton').addEventListener('click', async () => {
         startspellings();
    });
    document.getElementById('scorebutton').addEventListener('click', async () => {
        let htmlnewtext = displayscoreshtml();
        document.getElementById("rootdiv").innerHTML = htmlnewtext;
   });
   document.getElementById('exportbutton').addEventListener('click', async () => {
        exportsave();
    });
}

makestart();
window.onbeforeunload = function () {return false;}
//console.log(getscores());


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
