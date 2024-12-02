import getGrid from "./wfc.mjs"

let mainGrid 
function setup(){
    mainGrid = getGrid("./grass2.png")
}

function draw() {
  background(220);
  mainGrid.displayGrid()
}