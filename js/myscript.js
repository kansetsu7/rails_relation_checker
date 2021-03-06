/**
 * @author kansetsu7
 * @version 1.0
 */

/**
 * Basic function for checking [belongs_to] and [has_many] association
 * Called by chkBtHm() and chkHmTh()
 * 
 * @param  {String}     mode        |for indentifing checking mode
 * @param  {Array}      inputs      |user inputs from panel
 * @param  {Object}     resultPanel |result panel(HTML) for printing result
 * 
 * @return {Map}        associationMap |if passed
 * @return {undefined}  undefined   |if error
 * @return {null}       null        |if DB Schema field is not filled
 */
function checkBase(mode, inputs, resultPanel) {
  /**************************
  * inputs[0] myModelName
  * inputs[1] relatoinInput
  * inputs[2] fk
  * inputs[3] refModelName
  * inputs[4] pk
  **************************/

  printMsgH(resultPanel, 2, "************* " + getTypeName(mode) + " *************<br>","aqua");
  // check if model name or input lines is correct
  if (!chkMyModelName(inputs[0], resultPanel)) return;
  if (!chkAssociationLines(mode, inputs[1].split("\n"), resultPanel)) return;

  // check if association symbol is correct
  var associationArray = inputs[1].split(",");
  var map = chkAssociationSymbol(associationArray, resultPanel, mode);
  if (!map.get("chk")) return;

  // turn association Array into Map. Print user inputs and Rails convention
  var associationMap = getAssociationMap(map.get("association"));
  showUserInputs(resultPanel, inputs[0], map.get("association"), mode); 
  showRailsConvention(resultPanel, inputs[0], associationMap.get(getTypeName(mode)), mode);

  // check if association follows rails convention
  var result = chkDbSchemaInput(resultPanel, inputs, associationMap, mode);
  if (result === null) return null; // if DB Schema field is not filled 
  if (result) return associationMap;   // if passed
  return undefined;                 // if error
}

/**
 * Function for checking [belongs_to] and [has_many] 
 * It gather params for checkBase(), and then call checkBase() 
 * Called by input button
 * 
 * @return {undefine} |it don't return 
 */
function chkBtHm() {
  var resultPanel = document.getElementById("result-panel");
  cleanPan(resultPanel);
  var mode = getMode();
  if (mode === "") {
    console.log("WTF have you done?");
    alert("WTF have you done?");
    return;
  }
  var inputs = getInputs(mode);
  checkBase(mode, inputs, resultPanel);
}

/**
 * Function for checking "whole" [has_many :through]
 * It gather params for checkBase(), and then call checkBase() for checking
 *    [belongs_to] and [has_many] first, then call chkThrough() and chkThroughAssociation()
 *    for checking "only" [has_many :through]
 * Called by input button
 * 
 * @return {undefine} |it don't return 
 */
function chkHmTh() {
  var resultPanel = document.getElementById("result-panel");
  cleanPan(resultPanel);
  var mode = getMode();
  if (mode === "") {
    console.log("WTF have you done?");
    alert("WTF have you done?");
    return;
  }

  /**************************
  * inputsBl / inputsHm
  * [0] myModelName
  * [1] relatoinInput
  * [2] fk
  * [3] refModelName
  * [4] pk
  **************************/

  // check [belongs_to] and [has_many] by checkBase()
  var inputsBl = getInputs("b");
  var blMap = checkBase("b", inputsBl, resultPanel);
  var inputsHm = getInputs("m");
  var hmMap = checkBase("m", inputsHm, resultPanel);

  // if DB Schema field is not filled, show error message and return
  if (blMap === null || hmMap === null) {
    if (getLanguage() === "en") {
      printMsgH(resultPanel, 3, "Please fill out DB Schema....<br>","orange");
    } else {
      printMsgH(resultPanel, 3, "大俠您把DB Schema的欄位填好再來吧....<br>","orange");
    }    
    return;
  }

  // if both [belongs_to] and [has_many] association setup are correct
  // then check "only" [has_many :through], otherwise show error and return
  if (typeof blMap === 'object' && typeof hmMap === 'object') {
    // check "only" [has_many :through]
    var hmthMap = chkThrough(resultPanel, inputsHm[0]);
    if (typeof hmthMap !== 'object') return;
    chkThroughAssociation(blMap, hmMap, hmthMap, inputsBl[0], resultPanel);
  } else {
    if (getLanguage() === "en") {
      printMsgH(resultPanel, 3, "Please fix the errors above and then press 'Check' button again....<br>","orange");
    } else {
      printMsgH(resultPanel, 3, "大俠您把上面的東西修好再來吧....<br>","orange");
    }
  }
}

/**
 * Function for checking "only" [has_many :through]
 * Called by chkHmTh()
 * 
 * @param  {Object} resultPanel |result panel(HTML) for printing result
 * @param  {String} hmModelName |model name of [has_many] association
 * @return {Map}    associationMap |map of user input associations 
 */
function chkThrough(resultPanel, hmModelName) {
  printMsgH(resultPanel, 2, "************* has_many :through *************<br>","aqua");
  var inputsTh = getThroughTextArea();

  // check if model name or input lines is correct
  if (!chkAssociationLines("t", inputsTh.split("\n"), resultPanel)) return;
  var associationArray = inputsTh.split(",");
  var map = chkThroughSymbol(associationArray, resultPanel);
  if (!map.get("chk")) return;

  showUserInputs2(resultPanel, hmModelName, map.get("association"));
  printMsgLine(resultPanel, "==== checking result ====<br>","code-white");
  return getAssociationMap(map.get("association"));
}

/**
 * Check if model name follows Rails convention
 * Called by checkBase()
 * 
 * @param  {String} myModelName |model name of
 * @param  {Object} resultPanel |result panel(HTML) for printing result
 * @return {Boolean} ----       |model name follows Rails convention or not
 */
function chkMyModelName(myModelName, resultPanel) {
  // check if model name is empty
  // if not empty then call chkCapitalize() for checking first letter
  if (myModelName === "") {
    printMyModelNameErrors(1, resultPanel);  //can't be blank
    return false;
  }
  if (!isNaN(myModelName.charAt(0))) {   //first latter is a number
    printMyModelNameErrors(2, resultPanel);  //can't start with numbers
    return false;
  }
  if (firstLetterIsLowerCase(myModelName)) {
    printMyModelNameErrors(3, resultPanel);  //First letter should in uppercase
    return false;
  }

  // check if model name is singular
  if (isPlural(myModelName)) {
    printMyModelNameErrors(4, resultPanel);  //should in singular term
    return false;
  }
  return true;
}

/**
 * Check if association input is only one line
 * Called by checkBase() and chkThrough()
 * 
 * @param  {String}   mode            |for indentifing checking mode
 * @param  {Array}    relatoinInput   |user input association from panel, split by \n
 * @param  {Object}   resultPanel     |result panel(HTML) for printing result
 * @return {Boolean}
 */
function chkAssociationLines(mode, relatoinInput, resultPanel) {
  if (mode === "b" || mode === "m" || mode === "t") {
    if (relatoinInput.length == 1) {
      return true;
    }
    // print error and return
    if (getLanguage() === "en") {
      printMsgLine(resultPanel, "Error: only allow one line input!","red");
    } else {
      printMsgLine(resultPanel, "錯誤：輸入超過一行","red");
    }
    
    return false;
  }
  printMsgLine(resultPanel, "錯誤：chkAssociationLines有奇怪的Bug啊啊啊啊！","red");
  return false;
}

/**
 * Checking association symbol for [belongs_to] and [has_many]
 * return map {("chk", false)} if not pass
 * return map {("chk", true), ("association", association2)} if pass
 * association2 is user input association split by colon :
 * Called by checkBase()
 * 
 * @param  {Array}    association      |user input association from panel, split by comma ,
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   mode          |for indentifing checking mode
 * @return {Map}      map           |pass or ont
 */
function chkAssociationSymbol(association, resultPanel, mode) {
  var association2 = [];
  for (var i = 0; i <= association.length-1; i++) {
    association2.push(association[i].split(":"));
  }
  var map = new Map();
  map.set("chk", false);

  if (!chkAssociationKeyword(association2[0][0].trim(), mode, resultPanel)) return map;
  if (!chkAssociationMethodName(association2[0][1].trim(), mode, resultPanel)) return map;

  // check arguments of association. 
  // if not pass, show location that might cause error and return
  for (var i = 0; i < association2.length; i++) {
    if (association2[i].length < 2) {  //Problem with symbol: comma or colon
      printAssociationSymbolError(1, association2[i][0], resultPanel);
      return map;
    }
    if (association2[i].length > 2) {  //Problem with symbol: comma or colon
      printAssociationSymbolError(1, association2[i][1], resultPanel);
      return map;
    }
    if (association2[i][0].trim() === "") {  //Problem with symbol: comma or colon
      printAssociationSymbolError(1, association2[i-1][1], resultPanel);
      return map;
    }
    if (association2[i][1].trim() === "") {  //Problem with symbol: comma or colon
      printAssociationSymbolError(1, association2[i][0], resultPanel);
      return map;
    }
    if (i > 0) {
      if (!chkAssociationArg(association2[i][0].trim())) {  //Invalid options
        printAssociationSymbolError(2, association2[i][0], resultPanel);
        return map;
      }
      if (chkRightSpace(association2[i][0])) {  //No space between colon
        printAssociationSymbolError(3, association2[i][0], resultPanel);
        return map;
      }
      if (!chkDoubleQuotes(association2[i][1].trim())) {  //lack of double quotes
        printAssociationSymbolError(4, association2[i][1], resultPanel);
        return map;
      }
    } else {
      if (chkLeftSpace(association2[0][1])) {  //No space between colon
        printAssociationSymbolError(3, association2[0][1], resultPanel);
        return map;
      }
    }
  }
  map.set("association", association2);
  map.set("chk", true);
  return map;
}

/**
 * Checking association symbol for [has_many :through]
 * return map {("chk", false)} if not pass
 * return map {("chk", true), ("association", association2)} if pass
 * association2 is user input association split by colon :
 * Called by chkThrough()
 * 
 * @param  {Array}    association      |user input association from panel, split by comma ,
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @return {Map}      map           |pass or ont
 */
function chkThroughSymbol(association, resultPanel) {
  var association2 = [];
  for (var i = 0; i <= association.length-1; i++) {
    association2.push(association[i].split(":"));
  }
  var map = new Map();
  map.set("chk", false);

  // check keyword = has_many
  if (!chkAssociationKeyword(association2[0][0].trim(), "m", resultPanel)) return map;

  // check arguments of association. 
  // if not pass, show location that might cause error and return
  if (association2[0].length < 2) {  //problem with comma or colon, place known
    printThroughSymbolError(1, association2[0][0], resultPanel);
    return map;
  }
  if (association2[0].length > 2) {  //problem with comma or colon, place known
    printThroughSymbolError(1, association2[0][1], resultPanel);
    return map;
  }
  if (association2[0][0] === "" || association2[0][1] === "") {  //problem with comma or colon, place unknown
    printThroughSymbolError(2, "", resultPanel);
    return map;
  }
  // through & source
  if (association2.length < 2) {  //lack of through option
    printThroughSymbolError(3, "", resultPanel);
    return map;
  }
  for (var i = 1; i < association2.length; i++) {
    if (association2[i].length === 1 && association2[i][0] === "") {  //user input additional comma
      console.log(association2[i].length);
      printThroughSymbolError(4, association2[i-1][association2[i-1].length-1], resultPanel);
      return map;
    }else if (association2[i].length !== 3) {  //problem with comma or colon, place after comma
      console.log(association2[i][0]);
      printThroughSymbolError(8, association[i], resultPanel);
      return map;
    }
    if (!chkHmThArg(association2[i][0].trim())) {  //Invalid options
      printThroughSymbolError(5, association2[i][0], resultPanel);
      return map;
    }
    if (chkRightSpace(association2[i][0])) {  //space between colon and keyword
      printThroughSymbolError(6, association2[i][0], resultPanel);      
      return map;
    }
    if (association2[i][1].trim() !== "") {  //space between colons
      printThroughSymbolError(7, association2[i][0], resultPanel);
      return map;
    }
    if (chkLeftSpace(association2[i][2])) {  //space between colon and keyword
      printThroughSymbolError(6, association2[1][2], resultPanel);
      return map;
    } else {
      // copy to [i][1] to fit getAssociationMap() rule, it only read array[0] and array[1].
      association2[i][1] = association2[i][2];  
    }
  }
  map.set("association", association2);
  map.set("chk", true);
  return map;
}

/**
 * check [has_many :through] association, print result on result panel
 * Called by chkHmTh()
 * 
 * @param  {Map}      bMap          |map of [belongs_to] association
 * @param  {Map}      mMap          |map of [has_many] association
 * @param  {Map}      tMap          |map of [has_many :through] association
 * @param  {String}   bModelName    |model name of [belongs_to] association
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @return {}         ----          |it don't return
 */
function chkThroughAssociation(bMap, mMap, tMap, bModelName, resultPanel) {
  if (tMap.get("through") === mMap.get("has_many")) {  //[has_many :through] matches [has_many]
    printMsgWithIcon(resultPanel, getThroughAssociationOkMsg(1, tMap.get("through"), mMap.get("has_many"), ""),"lawnGreen", true);
    if (getUpperSingular(mMap.get("has_many")) === bModelName) {  //bModelName matches [has_many]
      printMsgWithIcon(resultPanel, getThroughAssociationOkMsg(2, bModelName, mMap.get("has_many"), ""),"lawnGreen", true);
      if (tMap.get("source") === undefined) {
        if (tMap.get("has_many") === bMap.get("belongs_to").plural()) {  //[has_many :through] matches [belongs_to]
          printMsgWithIcon(resultPanel, getThroughAssociationOkMsg(3, tMap.get("has_many"), bMap.get("belongs_to"), ""),"lawnGreen", true);
          return;
        }
        // has_many and belongs_to not match
        printMsgLine(resultPanel, getThroughAssociationErrorMsg(1, tMap.get("has_many"), bMap.get("belongs_to")),"red");
        return;
      } else {  // have [source] arg
        if (tMap.get("source") === bMap.get("belongs_to")) {
          if (tMap.get("has_many") === bMap.get("belongs_to").plural()) {  // source , belongs_to and has_many matches
            printMsgWithIcon(resultPanel, getThroughAssociationOkMsg(4, tMap.get("source"), bMap.get("belongs_to"), tMap.get("has_many")),"lawnGreen", true);
            return;
          }
          printMsgWithIcon(resultPanel, getThroughAssociationOkMsg(5, tMap.get("source"), bMap.get("belongs_to"), tMap.get("has_many")),"orange", true);
          return;
        }
        // source and belongs_to not match
        printMsgLine(resultPanel, getThroughAssociationErrorMsg(2, tMap.get("source"), bMap.get("belongs_to")),"red");
        return;
      }
    }
    // bModelName and has_many not match
    printMsgLine(resultPanel, getThroughAssociationErrorMsg(3, bModelName, mMap.get("has_many")),"red");
    return;
  }
    // through and has_many not match
    printMsgLine(resultPanel, getThroughAssociationErrorMsg(4, tMap.get("through"), mMap.get("has_many")),"red");
  return;
}

/**
 * check [belongs_to] [has_many] association arguments equals to following words
 *    class_name, foreign_key, primary_key
 *
 * Called by chkAssociationSymbol() 
 * @param  {String}   str   |association argument
 * @return {Boolean}  --    |equals or not
 */
function chkAssociationArg(str) {
  legalArguments = ["class_name", "foreign_key", "primary_key"]
  for (var i = 0; i < legalArguments.length; i++) {
    if (str === legalArguments[i]) return true;    
  }
  return false;
}

/**
 * check [has_many :through] association arguments equals to following words
 *    through, source
 *
 * Called by chkAssociationSymbol() 
 * @param  {String}   str   |association argument
 * @return {Boolean}  --    |equals or not
 */
function chkHmThArg(str) {
  if (str === "through" || str === "source") {
    return true;
  }
  return false;
}

/**
 * check if target keyword equals Rails association type [belongs_to] or [has_many]
 * Called by chkAssociationSymbol() and chkThroughSymbol()
 * @param  {String}   keyword       |target
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   mode          |for indentifing checking mode
 * @return {Boolean}  ---           |equals or ont
 */
function chkAssociationKeyword(keyword, mode, resultPanel) {
  switch (mode) {
    case "b":
      if (keyword !== "belongs_to") {
        if (getLanguage() === "en") {
          printMsgLine(resultPanel, "Error: \'"+keyword+"\' should be \'belongs_to\'","red");
        } else {
          printMsgLine(resultPanel, "錯誤：你的"+keyword+"應為belongs_to","red");
        }
        return false;
      }
      return true;

    case "m":
      if (keyword !== "has_many") {
        if (getLanguage() === "en") {
          printMsgLine(resultPanel, "Error: \'"+keyword+"\' should be \'has_many\'","red");
        } else {
          printMsgLine(resultPanel, "錯誤：你的"+keyword+"應為has_many","red");
        }
        return false;
      }
      return true;

    case "t": // bypass, check later if no [source] argument.
      return true;

    default:
      printMsgLine(resultPanel, "錯誤：chkAssociationKeyword有奇怪的Bug啊啊啊啊！","red");
      return false;
  }
}
/**
 * check if association method follows Rails convention
 * Called by chkAssociationSymbol()
 * 
 * @param  {String}   methodName    |method name of association
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   mode          |for indentifing checking mode
 * @return {Boolean}  ---           |follows or ont
 */
function chkAssociationMethodName(methodName, mode, resultPanel) {
  if (firstLetterIsUpperCase(methodName)) {
    printAssociationMethodNameError(1, methodName, resultPanel);  //First letter should in lowercase
    return false;
  }

  switch (mode) {
    case "b":
      if (isPlural(methodName)) {
        printAssociationMethodNameError(2, methodName, resultPanel);  //should in singular term   
        return false;
      }
      return true;

    case "m":
      if (isSingular(methodName)) {
        printAssociationMethodNameError(3, methodName, resultPanel);  //should in plural term
        return false;
      }
      return true;

    default:
      printMsgLine(resultPanel, "錯誤：chkAssociationMethodName有奇怪的Bug啊啊啊啊！","red");
      return false;
  }
}

/**
 * write Rails convention setup on result panel
 * Called by checkBase()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   modelName     |modelName name of association
 * @param  {String}   methodName    |method name of association
 * @param  {Number}   mode          |for indentifing checking mode
 */
function showRailsConvention(resultPanel, modelName, methodName, mode) {
  showResultBasics(resultPanel, "Rails convention", modelName, methodName, mode);
  printMsgSpan(resultPanel, ", ", "code-white");
  printMsgSpan(resultPanel, "class_name: ", "code-purple");
  printMsgSpan(resultPanel, "\"" + upFirstLetter(methodName) + "\"", "code-yellow");
  printMsgSpan(resultPanel, ", ", "code-white");
  printMsgSpan(resultPanel, "foreign_key: ", "code-purple");
  if (mode === 'm') {
    printMsgSpan(resultPanel, "\"" + lowFirstLetter(modelName) + "_id\"", "code-yellow");
  } else {
    printMsgSpan(resultPanel, "\"" + methodName + "_id\"", "code-yellow");
  }
  printMsgSpan(resultPanel, ", ", "code-white");
  printMsgSpan(resultPanel, "primary_key: ", "code-purple");
  printMsgSpan(resultPanel, "\"id\"", "code-yellow");
  printMsgLine(resultPanel, "end", "code-red");
}

/**
 * check given DB schema follows Rails convention or not
 * Called by checkBase()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {Array}    inputs        |user inputs from panel
 * @param  {Map}      association   |association 
 * @param  {String}   mode          |for indentifing checking mode
 * 
 * @return {Null}     null          |if DB schema not been set
 * @return {Boolean}  result        |follows or not
 */
function chkDbSchemaInput(resultPanel, inputs, association, mode) {
  // inputs[0] myModelName
  // inputs[2] fk
  // inputs[3] refTableName
  // inputs[4] pk

  if (inputs[2] === "" && inputs[3] === "" && inputs[4] === "") {
    return null;  // if DB schema not been set, return
  }

  var result = true;
  printMsgLine(resultPanel, "==== checking result ====<br>","code-white");

  // use different function to verify convention depends on mode
  if (mode === "m" || mode === "t") {
    for (var i = 2; i < inputs.length; i++) {
      if (bothSidesAreLetter(inputs[i])) {
        if (!chkHasManyConvention(resultPanel, inputs, association, i, inputs[0])) result = false;
      } else {
        printDbSchemaInputError(i, resultPanel);
        result = false;
      }
    }
  } else { // mode === "b"
    for (var i = 2; i < inputs.length; i++) {
      if (bothSidesAreLetter(inputs[i])) {
        if (!chkBelongsToConvention(resultPanel, inputs, association, i)) result = false;
      } else {
        printDbSchemaInputError(i, resultPanel);
        result = false;
      }
    }
  }

  return result;
}

/**
 * ONLY FOR [has_many]
 * check if given input follows Rails convention or not
 * Called by chkDbSchemaInput()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {Array}    inputs        |user inputs from panel
 * @param  {Map}      association   |association of [has_many]
 * @param  {Number}   inputIndex    |index of inputs array from chkDbSchemaInput()
 * @param  {String}   myModelName   |model name of [has_many]
 * @return {Boolean}  ---           |follows or not
 */
function chkHasManyConvention(resultPanel, inputs, association, inputIndex, myModelName) {
  var has_many = association.get("has_many");
  var chkVal = inputs[inputIndex];

  switch (inputIndex) {
    case 2:
      if (firstLetterIsUpperCase(chkVal)) {  //should in lowercase
        printMsgLine(resultPanel, getChkConventionErrorMsg(1, getInputName(inputIndex)),"red");
        return false;
      }
      var foreign_key = association.get("foreign_key");
      var convention = lowFirstLetter(myModelName) + "_id";
      if (foreign_key === chkVal) {
        if (foreign_key === convention) {  //option may be omitted - foreign_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "foreign_key"),"lawnGreen", true);
        } else {  //option may NOT be omitted - foreign_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(2, "foreign_key"),"orange", true);
        }
      } else if (lowFirstLetter(association.get("class_name")) + "_id" === inputs[2]){
        printMsgWithIcon(resultPanel, getChkConventionOkMsg(3, "foreign_key"),"orange", true);
      } else if (foreign_key === undefined && chkVal === convention) {  //option may be omitted - foreign_key
        printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "foreign_key"),"lawnGreen", true);
      } else {  //Wrong option supplied - foreign_key
        printMsgWithIcon(resultPanel, getChkConventionErrorMsg(3, chkVal, "foreign_key"),"red", false);
        return false;
      }
      break;

    case 3:
      if (firstLetterIsLowerCase(chkVal)) {  //should in uppercase
        printMsgLine(resultPanel, getChkConventionErrorMsg(2, getInputName(inputIndex)),"red");
        return false;
      }
      var class_name = association.get("class_name");
      var convention = getUpperSingular(has_many); //different
      if (class_name === chkVal) {
        if (class_name === convention) {  //option may be omitted - class_name
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "class_name"),"lawnGreen", true);
        } else {  //option may NOT be omitted - class_name
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(2, "class_name"),"orange", true);
        }
      } else if (class_name === undefined && chkVal === convention) {  //option may be omitted - class_name
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "class_name"),"lawnGreen", true);
      } else {  //Wrong option supplied - class_name
        printMsgWithIcon(resultPanel, getChkConventionErrorMsg(3, chkVal, "class_name"),"red", false);
        return false;
      }
      break;

    case 4:
      if (firstLetterIsUpperCase(chkVal)) {  //should in lowercase
        printMsgLine(resultPanel, getChkConventionErrorMsg(1, getInputName(inputIndex)),"red");
        return false;
      }
      var primary_key = association.get("primary_key");
      var convention = "id";
      if (primary_key === chkVal) {
        if (primary_key === convention) {  //option may be omitted - primary_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "primary_key"),"lawnGreen", true);
        } else {  //option may NOT be omitted - primary_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(2, "primary_key"),"orange", true);
        }
      } else if (primary_key === undefined && chkVal === convention) {  //option may be omitted - primary_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "primary_key"),"lawnGreen", true);
      } else {  //Wrong option supplied - primary_key
        printMsgWithIcon(resultPanel, getChkConventionErrorMsg(3, chkVal, "primary_key"),"red", false);
        return false;
      }
      break;

    default:
      printMsgLine(resultPanel, "錯誤：chkHasManyConvention有奇怪的Bug啊啊啊啊！","red");
      return false;
  }

  return true;
  

}

/**
 * ONLY FOR [belongs_to]
 * check if given input follows Rails convention or not
 * Called by chkDbSchemaInput()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {Array}    inputs        |user inputs from panel
 * @param  {Map}      association   |association of [belongs_to]
 * @param  {Number}   inputIndex    |index of inputs array from chkDbSchemaInput()
 * @return {Boolean}  ---           |follows or not
 */
function chkBelongsToConvention(resultPanel, inputs, association, inputIndex) {
  var belongs_to = association.get("belongs_to");
  var chkVal = inputs[inputIndex];

  switch (inputIndex) {
    case 2:
      if (firstLetterIsUpperCase(chkVal)) {  //should in lowercase
        printMsgLine(resultPanel, getChkConventionErrorMsg(1, getInputName(inputIndex)),"red");
        return false;
      }
      var foreign_key = association.get("foreign_key");
      var convention = belongs_to + "_id";
      if (foreign_key === chkVal) {
        if (foreign_key === convention) {  //option may be omitted - foreign_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "foreign_key"),"lawnGreen", true);
        } else {  //option may NOT be omitted - foreign_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(2, "foreign_key"),"orange", true);
        }
      } else if (lowFirstLetter(association.get("class_name")) + "_id" === inputs[2]){
        printMsgWithIcon(resultPanel, getChkConventionOkMsg(3, "foreign_key"),"orange", true);
      } else if (foreign_key === undefined && chkVal === convention) {  //option may be omitted - foreign_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "foreign_key"),"lawnGreen", true);
      } else {  //Wrong option supplied - foreign_key
        printMsgWithIcon(resultPanel, getChkConventionErrorMsg(3, chkVal, "foreign_key"),"red", false);
        return false;
      }
      break;

    case 3:
      if (firstLetterIsLowerCase(chkVal)) {  //should in uppercase
        printMsgLine(resultPanel, getChkConventionErrorMsg(2, getInputName(inputIndex)),"red");
        return false;
      }
      var class_name = association.get("class_name");
      var convention = upFirstLetter(belongs_to);
      if (class_name === chkVal) {
        if (class_name === convention) {  //option may be omitted - class_name
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "class_name"),"lawnGreen", true);
        } else {  //option may NOT be omitted - class_name
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(2, "class_name"),"orange", true);
        }
      } else if (class_name === undefined && chkVal === convention) {  //option may be omitted - class_name
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "class_name"),"lawnGreen", true);
      } else {  //Wrong option supplied - class_name
        printMsgWithIcon(resultPanel, getChkConventionErrorMsg(3, chkVal, "class_name"),"red", false);
        return false;
      }
      break;

    case 4:
      if (firstLetterIsUpperCase(chkVal)) {  //should in lowercase
        printMsgLine(resultPanel, getChkConventionErrorMsg(1, getInputName(inputIndex)),"red");
        return false;
      }
      var primary_key = association.get("primary_key");
      var convention = "id";
      if (primary_key === chkVal) {
        if (primary_key === convention) {  //option may be omitted - primary_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "primary_key"),"lawnGreen", true);
        } else {  //option may NOT be omitted - primary_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(2, "primary_key"),"orange", true);
        }
      } else if (primary_key === undefined && chkVal === convention) {  //option may be omitted - primary_key
          printMsgWithIcon(resultPanel, getChkConventionOkMsg(1, "primary_key"),"lawnGreen", true);
      } else {  //Wrong option supplied - primary_key
        printMsgWithIcon(resultPanel, getChkConventionErrorMsg(3, chkVal, "primary_key"),"red", false);
        return false;
      }
      break;

    default:
      printMsgLine(resultPanel, "錯誤：chkBelongsToConvention有奇怪的Bug啊啊啊啊！","red");
      return false;
  }

  return true;
}

/**
 * check given string is start/end with letters
 * Called by chkDbSchemaInput()
 * 
 * @param  {String}   str
 * @return {Boolean}  ---   |is or not
 */
function bothSidesAreLetter(str) {
  var letters = /^[A-Za-z](.*[A-Za-z])?$/;
  return str.match(letters) ? true : false;
}

/**
 * tell given string is letter or not
 * @param  {String}  str [description]
 * @return {Boolean}     [description]
 */
function isLetter(str) {
  var letters = /^[A-Za-z]+$/;
  return str.match(letters) ? true : false;
}

/**
 * check if the string have white space on right side
 * Called by chkAssociationSymbol() and chkThroughSymbol()
 * @param  {String}   str
 * @return {Boolean}
 */
function chkRightSpace(str) {
  return str.charAt(str.length - 1) === " " ? true : false;
}

/**
 * check if the string have white space on left side
 * Called by chkAssociationSymbol() and chkThroughSymbol()
 * 
 * @param  {String}   str
 * @return {Boolean}
 */
function chkLeftSpace(str) {
  return str.charAt(0) === " " ? true : false;
}

/**
 * check if the string have double quotes on both side and not just double quotes only
 * Called by chkAssociationSymbol()
 * 
 * @param  {String}   str
 * @return {Boolean}
 */
function chkDoubleQuotes(str) {
  return (trimDQ(str) !== "" && (str === "\"" + trimDQ(str) + "\"")) ? true : false;
}

/**
 * return mode depends on which radio input is selected
 * Called by chkBtHm() and chkHmTh()
 * @return {String} 
 */
function getMode() {
  for (var i = 1; i < 4; i++) {
    if (document.getElementById("radio" + i).checked) {
      switch (i) {
        case 1:
          return "b";  // belongs_to
        case 2:
          return "m";  // has_many
        case 3:
          return "t";  // has_many :through
        default:
          return "";   // error!
      }
    }
  }
}

/**
 * get input objects, depends on mode
 * Called by chkBtHm() and chkHmTh()
 * 
 * @param  {String}  mode    |for indentifing checking mode
 * @return {Array}   inputs  |user inputs from panels 
 */
function getInputs(mode) {
  var prefixStr;
  switch (mode) {
    case "b":
      prefixStr = ["bl"]
      break;

    case "m":
      prefixStr = ["hm"]
      break;

    default:
      alert("getInputs ERROR!");
      return;
  } 
  var inputs = [];
  inputs.push(document.getElementById(prefixStr + "-my-model-name").value.trim());  // [0] myModelName
  inputs.push(document.getElementById(prefixStr + "-relatoin-input").value.trim());  // [1] relatoinInput
  inputs.push(document.getElementById(prefixStr + "-fk").value.trim());  // [2] fk
  inputs.push(document.getElementById(prefixStr + "-ref-model-name").value.trim());  // [3] refModelName
  inputs.push(document.getElementById(prefixStr + "-pk").value.trim()); // [4] pk

  return inputs;
}
/**
 * get textarea object of [has_many :through]
 * Called by chkThrough()
 * 
 * @return {object}
 */
function getThroughTextArea() {
  return document.getElementById("hmth-relatoin-input").value.trim();
}

/**
 * turn array into map
 * Called by checkBase(), chkThrough(), chkThroughSymbol()
 * 
 * @param  {Array}  association 
 * @return {Map}    map
 */
function getAssociationMap(association) {
  var map = new Map();
  for (var i = 0; i < association.length; i++) {
    map.set(association[i][0].trim(), trimDQ(association[i][1].trim()));
  }
  return map;
}

/**
 * get DB schema input column name
 * Called by printDbSchemaInputError(), chkHasManyConvention(), chkBelongsToConvention()
 * 
 * @param  {Number}  index
 * @return {String}
 */
function getInputName(index) {
  switch (index) {
    case 2:
      return getLanguage() === "en" ? " foreign key" : "外鍵";
    case 3:
      return " model name";
    case 4:
      return getLanguage() === "en" ? " primary key" : "主鍵";
  }
}

/**
 * get type name of mode
 * Called by checkBase(), showResultBasics()
 * @param  {String}  mode
 * @return {String}
 */
function getTypeName(mode) {
  switch (mode) {
    case "b":
      return "belongs_to";
    case "m":
      return "has_many";
    case "t":
      return "has_many :through";
    default:
      return "getTypeName有奇怪的Bug啊啊啊啊！";
  }
}

/**
 * set DB panel and inputs status depends on mode
 * Called by radio input
 * 
 * @param {String}  mode
 */
function setDbPanel(mode) {
  var bl_pk = document.getElementById("bl-pk");
  var bl_ref_model_name = document.getElementById("bl-ref-model-name");
  var bl_fk = document.getElementById("bl-fk");
  var bl_row = document.getElementById("bl-row");
  var hm_pk = document.getElementById("hm-pk");
  var hm_ref_model_name = document.getElementById("hm-ref-model-name");
  var hm_fk = document.getElementById("hm-fk");
  var hm_row = document.getElementById("hm-row");
  var chk_btn = document.getElementById("chk-btn");
  var hmth_relatoin_input = document.getElementById("hmth-relatoin-input");
  var disabled;
  var display;
  var cursor;
  var color;
  switch (mode) {
    case "b":
      disabled = [false, true];
      cursor = ["default", "no-drop"];
      color = ["white", "gray"];
      display = ["block", "none", "none"];
      chk_btn.onclick = function() {chkBtHm();};
      break;
    case "m":
      disabled = [true, false];
      cursor = ["no-drop", "default"];
      color = ["gray", "white"];
      display = ["none", "block", "none"];
      chk_btn.onclick = function() {chkBtHm();};
      break;
    case "t":
      disabled = [false, false];
      cursor = ["default", "default"];
      color = ["white", "white"];
      display = ["block", "block", "block"];
      chk_btn.onclick = function() {chkHmTh();};
      break;
    default:
      alert("BUG!!!!!");
      return;
  }

  bl_pk.disabled = disabled[0];
  bl_pk.style.backgroundColor = color[0];
  bl_pk.style.cursor = cursor[0];

  bl_ref_model_name.disabled = disabled[0];
  bl_ref_model_name.style.backgroundColor = color[0];
  bl_ref_model_name.style.cursor = cursor[0];

  bl_fk.disabled = disabled[0];
  bl_fk.style.backgroundColor = color[0];
  bl_fk.style.cursor = cursor[0];

  bl_row.style.display = display[0];

  hm_pk.disabled = disabled[1];
  hm_pk.style.backgroundColor = color[1];
  hm_pk.style.cursor = cursor[1];

  hm_ref_model_name.disabled = disabled[1];
  hm_ref_model_name.style.backgroundColor = color[1];
  hm_ref_model_name.style.cursor = cursor[1];

  hm_fk.disabled = disabled[1];
  hm_fk.style.backgroundColor = color[1];
  hm_fk.style.cursor = cursor[1];

  hm_row.style.display = display[1];
  hmth_relatoin_input.style.display = display[2];
}

/**
 * capitalize first letter of the given string
 * Called by getUpperSingular(), showRailsConvention(), chkBelongsToConvention()
 * 
 * @param  {String}
 * @return {String}
 */
function upFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * turn first letter of the given string to lowercase
 * Called by chkAssociationMethodName(), chkHasManyConvention()
 * 
 * @param  {String}
 * @return {String}
 */
function lowFirstLetter(str) {
  if (str === undefined) return 'undefined';
  return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * check if given string's first letter is lower case
 * Called by chkMyModelName(), chkHasManyConvention(), chkBelongsToConvention()
 * @param  {String}   str
 * @return {Boolean}
 */
function firstLetterIsLowerCase(str) {
  return str.charAt(0).toLowerCase() === str.charAt(0);
}

/**
 * check if given string's first letter is upper case
 * Called by chkAssociationMethodName(), chkHasManyConvention(), chkBelongsToConvention()
 * 
 * @param  {String}   str
 * @return {Boolean}
 */
function firstLetterIsUpperCase(str) {
  return str.charAt(0).toUpperCase() === str.charAt(0);
}

function association_log(association_array){
  console.log("[");
  association_array.forEach(function(arg, index){
    console.log("[" + arg[0] + "," + arg[1] + "]");
  })

  console.log("]");
}

/**
 * turn a string into singular and make it's first letter into uppercase
 * Called by chkThroughAssociation(), chkHasManyConvention()
 * 
 * @param  {String}
 * @return {String}
 */
function getUpperSingular(str) {
  return upFirstLetter(str).plural(true);
}

/**
 * get page language form html lang tag
 * @return {String} "en" for English, "tw" for Chinese tranditional
 */
function getLanguage() {
  var lang = document.documentElement.lang;
  return lang === "en" ? "en" : "tw";
}

/**
 * trim the double quotes on both side of the string 
 * Called by chkDoubleQuotes(), getAssociationMap()

 * @param  {String}
 * @return {String}
 */
function trimDQ(str) {
  return str.replace(/\"/gm, "");
}

/**
 * show basic elements on result panel
 * Called by showUserInputs(), showUserInputs2(), showRailsConvention()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   title         |just title...
 * @param  {String}   modelName     |modelName name of association
 * @param  {String}   methodName    |method name of association
 * @param  {Number}   mode          |for indentifing checking mode
 */
function showResultBasics(resultPanel, title, modelName, methodName, mode) {
  printMsgLine(resultPanel, "==== " + title + " ====<br>", "code-white");
  printMsgSpan(resultPanel, "Class ", "code-red");
  printMsgSpan(resultPanel, modelName, "code-green");
  printMsgSpan(resultPanel, " < ", "code-white");
  printMsgSpan(resultPanel, "ApplicationRecord<br>", "code-green");
  printMsgSpan(resultPanel, "&nbsp;&nbsp;" + getTypeName(mode) + " ", "code-white");
  printMsgSpan(resultPanel, ":" + methodName, "code-purple");
}

/**
 * show user input association setup in reuslt panel
 * ONLY for [has_many] [belongs_to]
 * Called by checkBase()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   myModelName   |modelName name of association
 * @param  {Array}    association      |association
 * @param  {Number}   mode          |for indentifing checking mode
 */
function showUserInputs(resultPanel, myModelName, association, mode) {
  showResultBasics(resultPanel, "your setup", myModelName, association[0][1], mode);
  for (var i = 1; i < association.length; i++) {
    printMsgSpan(resultPanel, ", ", "code-white")
    printMsgSpan(resultPanel, association[i][0]+ ": ", "code-purple")
    printMsgSpan(resultPanel, association[i][1], "code-yellow")
  }
  printMsgLine(resultPanel, "end", "code-red");
}

/**
 * show user input association setup in reuslt panel
 * ONLY for [has_many :through]
 * Called by chkThrough()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   myModelName   |modelName name of association
 * @param  {Array}    association      |association
 */
function showUserInputs2(resultPanel, myModelName, association) {
  showResultBasics(resultPanel, "your setup", myModelName, association[0][1], "m");
  for (var i = 1; i < association.length; i++) {
    printMsgSpan(resultPanel, ", ", "code-white")
    printMsgSpan(resultPanel, association[i][0]+ ": :", "code-purple")
    printMsgSpan(resultPanel, association[i][1], "code-purple")
  }
  printMsgLine(resultPanel, "end", "code-red");
}

/**
 * clean result panel, remove all child inside it
 * Called by chkBtHm() and chkHmTh()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 */
function cleanPan(resultPanel) {
  while (resultPanel.lastChild != null) {
    resultPanel.removeChild(resultPanel.lastChild);
  }
}

/**
 * print errors of chkMyModelName
 * Called by chkMyModelName()
 * @param  {Number} errorId     |error id
 * @param  {Object} resultPanel |result panel(HTML) for printing result
 */
function printMyModelNameErrors(errorId, resultPanel) {
  switch (errorId) {
    case 1:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Model name can't be blank!","red");
      } else {
        printMsgLine(resultPanel, "錯誤：Model名稱必填！","red");
      }
      break;

    case 2:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Model name can't start with numbers!","red");
      } else {
        printMsgLine(resultPanel, "錯誤：Model名開頭不能為數字！","red");
      }
      break;

    case 3:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: First letter of Model name should in uppercase!","red");
      } else {
        printMsgLine(resultPanel, "錯誤：Model名開頭需大寫！","red");
      }
      break;

    case 4:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Model name should in singular term!","red"); 
      } else {
        printMsgLine(resultPanel, "錯誤：Model名須為單數！","red");
      }
      break;

    default:
      printMsgLine(resultPanel, "錯誤：printMyModelNameErrors有奇怪的Bug啊啊啊啊！","red");
      break;
  }
}

/**
 * print errors of chkAssociationMethodName
 * Called by chkAssociationMethodName()
 * @param  {Number} errorId     |error id
 * @param  {String}  methodName  |name of method
 * @param  {Object} resultPanel |result panel(HTML) for printing result
 */
function printAssociationMethodNameError(errorId, methodName, resultPanel) {
  switch (errorId) {
    case 1:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: First letter of \'"+methodName+"\' should in lowercase, \'"+lowFirstLetter(methodName)+"\'.","red");
      } else {
        printMsgLine(resultPanel, "錯誤：你的"+methodName+"應為小寫開頭的"+lowFirstLetter(methodName),"red");
      }
      break;

    case 2:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: \'"+methodName+"\' should in singular term, \'"+methodName.plural(true)+"\'.","red");
      } else {
        printMsgLine(resultPanel, "錯誤：你的"+methodName+"應為單數"+methodName.plural(true),"red");    
      }
      break;

    case 3:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: \'"+methodName+"\' should in plural term, \'"+methodName.plural()+"\'.","red");
      } else {
        printMsgLine(resultPanel, "錯誤：你的"+methodName+"應為複數"+methodName.plural(),"red");
      }
      break;

    default:
      printMsgLine(resultPanel, "錯誤：printAssociationMethodNameError有奇怪的Bug啊啊啊啊！","red");
      break;
  }
}

/**
 * print errors of chkAssociationSymbol
 * Called by chkAssociationSymbol()
 * @param  {Number} errorId     |error id
 * @param  {String} keyword     |where error occured
 * @param  {Object} resultPanel |result panel(HTML) for printing result 
 */
function printAssociationSymbolError(errorId, keyword, resultPanel) {
  switch (errorId) {
    case 1:
      if (getLanguage() === "en") {
        var place = keyword === "" ? " [Umm...somewhere but I don't know] " : keyword;
        printMsgLine(resultPanel, "Error: Problem with symbol, please check your comma or colon.<br> - Error is near "+place,"red");
      } else {
        var place = keyword === "" ? " [痾...這不好說] " : keyword;
        printMsgLine(resultPanel, "錯誤：關聯設定符號有問題，請檢查你的逗號或冒號！<br>位於"+place+"附近。","red");
      }
      break;
      
    case 2:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Invalid options. Supported options are \'class_name\', \'foreign_key\', \'primary_key\'.<br> - Error cause by "+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：關鍵字應為\'class_name\', \'foreign_key\', \'primary_key\'其中之一。<br>位於"+keyword,"red");
      }
      break;
      
    case 3:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: There should be no space between colon and "+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：你的冒號要靠緊"+keyword, "red");
      }
      break;
      
    case 4:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Problem with symbol, please check your double quotes.<br> - Error is near "+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：關聯設定符號有問題，請檢查你的引號！<br>位於"+keyword+"附近。","red");
      }
      break;

    default:
      printMsgLine(resultPanel, "錯誤：printAssociationSymbolError有奇怪的Bug啊啊啊啊！","red");
      break;
  }
}

/**
 * print error of chkDbSchemaInput
 * Called by chkDbSchemaInput()
 * @param  {Number} inputId     |id of the input which cause error
 * @param  {Object} resultPanel |result panel(HTML) for printing result 
 */
function printDbSchemaInputError(inputId, resultPanel) {
  if (getLanguage() === "en") {
    printMsgLine(resultPanel, "Error: Invalid input of DB schema" + getInputName(inputId) ,"red");
  } else {
    printMsgLine(resultPanel, "錯誤：DB schema" + getInputName(inputId) + "欄位輸入有誤。","red");
  }       
}

/**
 * print error of chkThroughSymbol
 * Called by chkThroughSymbol()
 * @param  {Number} errorId     |error id
 * @param  {String} keyword     |where error occured
 * @param  {Object} resultPanel |result panel(HTML) for printing result 
 */
function printThroughSymbolError(errorId, keyword, resultPanel) {
  switch (errorId) {
    case 1:
      if (getLanguage() === "en") {
        var place = keyword === "" ? " [Umm...somewhere but I don't know] " : keyword;
        printMsgLine(resultPanel, "Error: Problem with symbol, please check your comma or colon.<br> - Error is near "+place,"red");
      } else {
        var place = keyword === "" ? " [痾...這不好說] " : keyword;
        printMsgLine(resultPanel, "錯誤：關聯設定符號有問題，請檢查你的逗號或冒號！<br>位於"+place+"附近。","red");
      }
      break;
      
    case 2:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Problem with symbol, please check your comma or colon.<br> - Error is near [Umm...somewhere but I don't know]","red");
      } else {
        printMsgLine(resultPanel, "錯誤：關聯設定符號有問題，請檢查你的逗號或冒號！<br>位置嘛...痾...這不好說。","red");
      }
      break;
      
    case 3:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Where's your through option?","red");
      } else {
        printMsgLine(resultPanel, "錯誤：你的through咧？","red");
      }
      
      break;
      
    case 4:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Problem with symbol, please check your comma.<br> - Error cause by the comma after "+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：關聯設定符號有問題，多了一個逗號！<br>位於"+keyword+"的逗號。","red");
      }
      break;
      
    case 5:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Invalid options. Supported options are \'through\', \'source\'.<br> - Error cause by "+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：關鍵字應為\'through\', \'source\'其中之一。<br>位於"+keyword,"red");
      }
      break;
      
    case 6:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: There should be no space between colon and "+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：你的冒號要靠緊"+keyword,"red");
      }
      break;
      
    case 7:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: There should only have a white space between colons of "+keyword+" option","red");
      } else {
        printMsgLine(resultPanel, "錯誤："+keyword+"的兩個冒號中間有奇怪的東西混進來了！","red");
      }
      break;
      
    case 8:
      if (getLanguage() === "en") {
        printMsgLine(resultPanel, "Error: Problem with symbol, please check your comma or colon.<br> - Error is at"+keyword,"red");
      } else {
        printMsgLine(resultPanel, "錯誤：關聯設定符號有問題，請檢查你的逗號或冒號！<br>位於"+keyword,"red");
      }
      break;

    default:
      printMsgLine(resultPanel, "錯誤：printThroughSymbolError有奇怪的Bug啊啊啊啊！","red");
      break;
  }
}

/**
 * return error message of chkHasManyConvention and chkBelongsToConvention
 * Called by chkHasManyConvention() and chkBelongsToConvention()
 * 
 * @param  {Number} msgId       |error message id
 * @param  {String} keyword     |where error occured or what it should be
 * @param  {String} option      |option name: foreign_key, primary_key, class_name
 * @return {String}             |error message
 */
function getChkConventionErrorMsg(msgId, keyword, option) {
  switch (msgId) {
    case 1:
      if (getLanguage() === "en") {
        return ("Error: First letter of \"" + keyword + "\" in DB schema field should in lowercase!");
      } else {
        return ("錯誤：DB schema" + keyword + "欄位字首要小寫。");
      }
      
    case 2:
      if (getLanguage() === "en") {
        return ("Error: First letter of \"" + keyword + "\" in DB schema field should in uppercase!");
      } else {
        return ("錯誤：DB schema" + keyword + "欄位字首要大寫。");
      }
      
    case 3:
      if (getLanguage() === "en") {
        return ("Error: Wrong " + option + " has been supplied in model setup, it should be \"" + keyword + "\"");
      } else {
        return (option + ": 關聯設定錯誤，應為\"" + keyword + "\"");
      }

    default:
      return "錯誤：getChkConventionErrorMsg有奇怪的Bug啊啊啊啊！";
  }
}

/**
 * return OK message of chkHasManyConvention and chkBelongsToConvention
 * Called by chkHasManyConvention() and chkBelongsToConvention()
 * 
 * @param  {Number} msgId       |OK message id
 * @param  {String} option      |option name: foreign_key, primary_key, class_name
 * @return {String}             |OK message
 */
function getChkConventionOkMsg(msgId, option) {
  switch (msgId) {
    case 1:
      if (getLanguage() === "en") {
        return (option + ": follows Rails convention, it may be omitted!");
      } else {
        return (option + ": 符合慣例，可省略!");
      }
      
    case 2:
      if (getLanguage() === "en") {
        return (option + ": not follows Rails convention, it may NOT be omitted!");
      } else {
        return (option + ": 不符慣例，不可省略!");
      }

    case 3:
      if (getLanguage() === "en") {
        return (option + ": not follows Rails convention, it may be omitted if the \"class_name\" option is correct!");
      } else {
        return (option + ": 不符慣例，但在class_name設定正確時可省略!");
      }

    default:
      return "錯誤：getChkConventionOkMsg有奇怪的Bug啊啊啊啊！";
  }
}

/**
 * return error message of chkThroughAssociation
 * Called by chkThroughAssociation()
 * 
 * @param  {Number} msgId       |error message id
 * @param  {String} keyword1    |where error occured
 * @param  {String} keyword2    |where error occured
 * @param  {String} keyword3    |where error occured
 * @return {String}             |error message
 */
function getThroughAssociationErrorMsg(errorId, keyword1, keyword2) {
  switch (errorId) {
    case 1:
      if (getLanguage() === "en") {
        return ("Error: "+keyword1+" of [has_many :through] does not match "+keyword2+" of [belongs_to], they should be the same, or you can supply source option in [has_many :through].");
      } else {
        return ("錯誤：[has_many :through]的"+keyword1+"跟[belongs_to]的"+keyword2+"對不上，兩者應要相同，或者[has_many :through]要設定source。");
      }
      
    case 2:
      if (getLanguage() === "en") {
        return ("Error: "+keyword1+" of [has_many :through] does not match "+keyword2+" of [belongs_to], they should be the same.");
      } else {
        return ("錯誤：[has_many :through]的"+keyword1+"跟[belongs_to]的"+keyword2+"對不上，兩者應要相同。");
      }
      
    case 3:
      if (getLanguage() === "en") {
        return ("Error: "+keyword1+" of [belongs_to] does not match "+keyword2+" of [has_many].<br> - Their relationship is : "+keyword1+" in plural term and lowercase by first letter = "+keyword2);
      } else {
        return ("錯誤：[belongs_to]的"+keyword1+"跟[has_many]的"+keyword2+"對不上。<br>兩者關係為"+keyword1+" -> 字首小寫x複數 = "+keyword2);
      }
      
    case 4:
      if (getLanguage() === "en") {
        return ("Error: "+keyword1+" of [has_many :through] does not match "+keyword2+" of [has_many], they should be the same.");
      } else {
        return ("錯誤：[has_many :through]的"+keyword1+"跟[has_many]的"+keyword2+"對不上，兩者應要相同。");
      }

    default:
      return "錯誤：getThroughAssociationErrorMsg有奇怪的Bug啊啊啊啊！";
  }
}

/**
 * return OK message of chkThroughAssociation
 * Called by chkThroughAssociation()
 * @param  {Number} msgId       |OK message id
 * @param  {String} keyword1    |option of association that follows rails convention
 * @param  {String} keyword2    |option of association that follows rails convention
 * @param  {String} keyword3    |option of association that follows rails convention
 * @return {String}             |OK message
 */
function getThroughAssociationOkMsg(msgId, keyword1, keyword2, keyword3) {
  switch (msgId) {
    case 1:
      if (getLanguage() === "en") {
        return (keyword1+" of [has_many :through] matches "+keyword2+" of [has_many].");
      } else {
        return ("[has_many :through]的"+keyword1+"跟[has_many]的"+keyword2+"對得上。")
      }

    case 2:
      if (getLanguage() === "en") {
        return (keyword1+" of [belongs_to] matches "+keyword2+" of [has_many].");
      } else {
        return ("[belongs_to]的"+keyword1+"跟[has_many]的"+keyword2+"對得上。");
      }

    case 3:
      if (getLanguage() === "en") {
        return (keyword1+" of [has_many :through] matches "+keyword2+" of [belongs_to].");
      } else {
        return ("[has_many :through]的"+keyword1+"跟[belongs_to]的"+keyword2+"對得上。");
      }

    case 4:
      if (getLanguage() === "en") {
        return ("source: :"+keyword1+" of [has_many] matches belongs_to :"+keyword2+" and has_many :"+keyword3+".<br> - source option may be omitted.");
      } else {
        return ("[has_many] 的source: :"+keyword1+"跟belongs_to:"+keyword2+"跟has_many :"+keyword3+"都對得上，source可省略。");
      }

    case 5:
      if (getLanguage() === "en") {
        return (keyword1+" of [has_many :through] matches "+keyword2+" of [belongs_to], but not matches :"+keyword3+" of [has_many :through].<br> - source option may NOT be omitted.");
      } else {
        return ("[has_many :through]的"+keyword1+"跟[belongs_to]的"+keyword2+"對得上，但跟[has_many :through]的方法名稱"+keyword3+"對不上，source不可省略。");
      }

    default:
      return "錯誤：getThroughAssociationOkMsg有奇怪的Bug啊啊啊啊！";
  }
}

/**
 * return OK message of chkHasManyConvention and chkBelongsToConvention
 * Called by chkHasManyConvention() and chkBelongsToConvention()
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   str           |string you want to show
 * @param  {String}   color         |a CSS color name or CSS id that set up 
 *                                   same color with sublawnGreen color scheme
 */
function printMsgLine(resultPanel, str, color) {
  var msg = document.createElement("p");
  if (color.includes("code")) {
    msg.classList.add(color);
  } else {
    msg.style.color = color;
  }
  msg.innerHTML = str;
  resultPanel.appendChild(msg);
}


/**
 * print message <h> with different size in particular color on result panel
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {Number}   size          |size of h, size = 1 => h1
 * @param  {String}   str           |string you want to show
 * @param  {String}   color         |a CSS color name or CSS id that set up 
 *                                   same color with sublawnGreen color scheme
 */
function printMsgH(resultPanel, size, str, color) {
  var msg = document.createElement("h" + size);
  if (color.includes("code")) {
    msg.classList.add(color);
  } else {
    msg.style.color = color;
  }
  msg.innerHTML = str;
  resultPanel.appendChild(msg);
}

/**
 * print message <span> in particular color on result panel
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   str           |string you want to show
 * @param  {String}   color         |a CSS id that set up same color with sublawnGreen color scheme
 */
function printMsgSpan(resultPanel, str, color) {
  var msg = document.createElement("span");
  msg.classList.add(color);
  msg.innerHTML = str;
  resultPanel.appendChild(msg);
}

/**
 * print message line with icon in particular color on result panel
 * 
 * @param  {Object}   resultPanel   |result panel(HTML) for printing result
 * @param  {String}   str           |string you want to show
 * @param  {String}   color         |a CSS color name or CSS id that set up 
 *                                   same color with sublawnGreen color scheme
 * @param  {Boolean} isOK        |print ok icon or not
 */
function printMsgWithIcon(resultPanel, str, color, isOK) {
  // icon
  var icon = document.createElement("i");
  if (isOK) {
    icon.className = "fa fa-check-circle";
  } else {
    icon.className = "fa fa-times-circle";
  }
  icon.style.color = color;
  icon.setAttribute("aria-hidden", "true");
  resultPanel.appendChild(icon);

  // message
  var msg = document.createElement("span");
  if (color.includes("code")) {
    msg.classList.add(color);
  } else {
    msg.style.color = color;
  }
  msg.innerHTML = "  " + str + "<br>";
  resultPanel.appendChild(msg);
}

/**
 * check if given string is singular or not
 * 
 * @param  {str}
 * @return {Boolean}
 */
function isSingular(str) {
  // DON'T USE TRIPLE EQUAL!!! 
  // they are not different type!
  // singularize a singular string will return an array not a string
  return str == str.plural(true);
}

/**
 * check if given string is plural or not
 * 
 * @param  {str}
 * @return {Boolean}
 */
function isPlural(str) {
  // DON'T USE TRIPLE EQUAL!!!
  // they are not different type!
  // pluralize a plural string will return an array not a string
  return str == str.plural();
}

/**
 * pluralize a string from input
 * print it on <h2>
 */
function pluralize_test() {
  var untransformed_text = document.getElementById("untransformed-text");
  var transformed_text = document.getElementById("transformed-text");
  if (isLetter(untransformed_text.value)) {
    transformed_text.innerHTML = "\'" + untransformed_text.value + "\' in plural term is \'" + untransformed_text.value.plural() + "\'";
  } else {
    transformed_text.innerHTML = "ENGLISH PLEASE!";
  }
}

/**
 * pluralize a string from input
 * print it on <h2>
 */
function singularize_test() {
  var untransformed_text = document.getElementById("untransformed-text");
  var transformed_text = document.getElementById("transformed-text");
  if (isLetter(untransformed_text.value)) {
    transformed_text.innerHTML = "\'" + untransformed_text.value + "\' in singular term is \'" + untransformed_text.value.plural(true) + "\'";
  } else {
    transformed_text.innerHTML = "ENGLISH PLEASE!";
  }
}

/**
 * print map elements in log
 * @param  {[type]} value [description]
 * @param  {[type]} key   [description]
 * @param  {[type]} map   [description]
 */
function logMapElements(value, key, map) {
  console.log("map["+key+"] = "+value);
}

/*
* pluralize a string
* usage: pluralize => singularString.plural();
*        singularize => pluralString.plural(true);
* reference: https://stackoverflow.com/questions/27194359/javascript-pluralize-a-string
*/
String.prototype.plural = function(revert){

    var plural = {
        '(quiz)$'               : "$1zes",
        '^(ox)$'                : "$1en",
        '([m|l])ouse$'          : "$1ice",
        '(matr|vert|ind)ix|ex$' : "$1ices",
        '(x|ch|ss|sh)$'         : "$1es",
        '([^aeiouy]|qu)y$'      : "$1ies",
        '(hive)$'               : "$1s",
        '(?:([^f])fe|([lr])f)$' : "$1$2ves",
        '(shea|lea|loa|thie)f$' : "$1ves",
        'sis$'                  : "ses",
        '([ti])um$'             : "$1a",
        '(tomat|potat|ech|her|vet)o$': "$1oes",
        '(bu)s$'                : "$1ses",
        '(alias)$'              : "$1es",
        '(octop)us$'            : "$1i",
        '(ax|test)is$'          : "$1es",
        '(us)$'                 : "$1es",
        '([^s]+)$'              : "$1s"
    };

    var singular = {
        '(quiz)zes$'             : "$1",
        '(matr)ices$'            : "$1ix",
        '(vert|ind)ices$'        : "$1ex",
        '^(ox)en$'               : "$1",
        '(alias)es$'             : "$1",
        '(octop|vir)i$'          : "$1us",
        '(cris|ax|test)es$'      : "$1is",
        '(shoe)s$'               : "$1",
        '(o)es$'                 : "$1",
        '(bus)es$'               : "$1",
        '([m|l])ice$'            : "$1ouse",
        '(x|ch|ss|sh)es$'        : "$1",
        '(m)ovies$'              : "$1ovie",
        '(s)eries$'              : "$1eries",
        '([^aeiouy]|qu)ies$'     : "$1y",
        '([lr])ves$'             : "$1f",
        '(tive)s$'               : "$1",
        '(hive)s$'               : "$1",
        '(li|wi|kni)ves$'        : "$1fe",
        '(shea|loa|lea|thie)ves$': "$1f",
        '(^analy)ses$'           : "$1sis",
        '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': "$1$2sis",        
        '([ti])a$'               : "$1um",
        '(n)ews$'                : "$1ews",
        '(h|bl)ouses$'           : "$1ouse",
        '(corpse)s$'             : "$1",
        '(us)es$'                : "$1",
        's$'                     : ""
    };

    var irregular = {
        'move'   : 'moves',
        'foot'   : 'feet',
        'goose'  : 'geese',
        'sex'    : 'sexes',
        'child'  : 'children',
        'man'    : 'men',
        'tooth'  : 'teeth',
        'gas'    : 'gases',
        'person' : 'people'
    };

    var uncountable = [
        'sheep', 
        'fish',
        'deer',
        'moose',
        'series',
        'species',
        'money',
        'rice',
        'information',
        'equipment'
    ];

    // save some time in the case that singular and plural are the same
    if(uncountable.indexOf(this.toLowerCase()) >= 0)
      return this;

    // check for irregular forms
    for(word in irregular){

      if(revert){
              var pattern = new RegExp(irregular[word]+'$', 'i');
              var replace = word;
      } else{ var pattern = new RegExp(word+'$', 'i');
              var replace = irregular[word];
      }
      if(pattern.test(this))
        return this.replace(pattern, replace);
    }

    if(revert) var array = singular;
         else  var array = plural;

    // check for matches using regular expressions
    for(reg in array){

      var pattern = new RegExp(reg, 'i');

      if(pattern.test(this))
        return this.replace(pattern, array[reg]);
    }

    return this;
}

/*
* 
* 
* 
*/