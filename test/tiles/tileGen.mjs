import getPixels from 'https://esm.sh/get-pixels'

/*a tile representing an nxn grid of pixel values in the ORIGINAL image.
the top left pixel of a tile goes in each cell within the grid*/
class Tile{
    constructor(grid, k, tileSize, imgSize){
      this.grid = grid         //2D array containing the grid
      this.k = k               //tile key (integer identifying the tile)
      this.tileSize = tileSize //number of pixels in the width/height of the tile (in an nxn grid, n is the tile size)
      this.frequencyHint = 1   //how frequently this tile appears in the original image
      this.imgSize = imgSize   //object containing the height and width of the original image

      //object where each direction has an array of tiles that can be put next to this tile (in that direction)
      this.adjacencyRules = {
        "up": [],   //all of the tiles that can be above this tile
        "down": [], //all of the tiles that can be below this tile
        "left": [], //all of the tiles that can be to the left of this tile
        "right": [] //all of the tiles that can be to the right of this tile
      }

    }

    //constructs the adjacencyRules object based on information gathered in the image
    generateAdjacencyRules(otherTiles, position, columns){
      const i = position - 1  //the index of the tile in the image
      const row = Math.floor(i / columns)
      const col = i % columns
      const totalRows = Math.floor(otherTiles.length / columns)
      if (row > 0){               // check if not on first row
        this.adjacencyRules.up.push(otherTiles[i - columns].k.toString())
      }
      if (row < totalRows - 1){   //check if not on last row
        this.adjacencyRules.down.push(otherTiles[i + columns].k.toString())
      }
      if (col > 0){               // check if not in first column
        this.adjacencyRules.left.push(otherTiles[i - 1].k.toString())
      }
      if (col < columns - 1){     //check if not in last column
        this.adjacencyRules.right.push(otherTiles[i + 1].k.toString())
      }
    }
}

//converts the input rgb val in an array to hex value
function rgbToHex(pixelVals){
  let outputStr = "#"

  for (const pixel of pixelVals){
    const hexVal = pixel.toString(16) //converts value using base 16
    outputStr += hexVal.length > 1 ? hexVal : "0" + hexVal //adds to the output and adds a 0 before if there is only 1 digit
  }

  return outputStr
}

//converts the pixels from the image into a 2d array representing one tile
function pixelsToMatrix(pxs, tileSize){
  let output = [...Array(tileSize)].map(a => Array(tileSize)) //initialises an empty 2d array with width and length tileSize
  for (let i = 0; i < pxs.length; i+=4){
    output[Math.floor(i/(4*tileSize))][(i/4)%tileSize] = rgbToHex(pxs.slice(i, i+3)) //matches pixel colour value with its x and y coordinates
  }
  return output
}
//turns a hex code into an rgb output
function hexToRgb(hex) {
  hex = hex.replace(/^#/, '')
  // turn shortened hex into full size form
  if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('')
  }

  // convert to RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return [r,g,b]
}

//checks if the colours are similar enough to be called the same (issue with image compression)
function areColoursSimilar(c1, c2) {
  const threshold = 10 //max difference in colours
  c1 = hexToRgb(c1)
  c2 = hexToRgb(c2)

  return (
    Math.abs(c1[0] - c2[0]) <= threshold &&  // red
    Math.abs(c1[1] - c2[1]) <= threshold &&  // green
    Math.abs(c1[2] - c2[2]) <= threshold     // blue
  )
}

//checks if tiles are duplicates
function dupeTile(tile1, tile2) {
  let dupe = true
  tile1.forEach((row, x) => {
    row.forEach((element, y) => {
      if (!areColoursSimilar(element, tile2[x][y])) { dupe = false } //sees if tiles are identical/almost identical
    })
  })
  return dupe
}

//gets the pixels in the range of the tile being processed
function getPixelsT(startX, startY, size, pixelArr, imgSize) {
  const block = []
  //loops through the x and y coordinates within the tile, starting at the top left pixel of the tile
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const row = startY + y
      const col = startX + x
      const i = (row * imgSize.w + col) * 4 //finds the corresponding index of the pixel in the pixel array
      block.push(
        pixelArr[i],      //R
        pixelArr[i + 1],  //G
        pixelArr[i + 2],  //B
        pixelArr[i + 3]   //A
      )
    }
  }
  return block
}

//gets all pixel colour values from the img and creates tiles from them. Excludes outer ring of tiles for continuity
async function getPixelValues(path, tileSize, tileSet, imgSize){
  return new Promise((resolve, reject) => {
    getPixels(path, function(err, pixels) {
      if(err) {
        console.error("Bad image path")
        throw Error("Bad image path")
      }
      const pixelVals = Array.from(pixels.data) //turns the rgba values of the pixels into an array

      //loops through the input image and creates tiles at regular intervals based on the tile size (will have duplicate tiles)
      for (let y = tileSize; y < imgSize.h - tileSize; y += tileSize) {
        for (let x = tileSize; x < imgSize.w - tileSize; x += tileSize) {
          const tileKey = (Object.keys(tileSet).length+1).toString() //k value of the tile
          //creates a new tile based on the pixels in the position of the tile
          tileSet[tileKey] = new Tile(
            pixelsToMatrix(
              getPixelsT(x, y, tileSize, pixelVals, imgSize),
              tileSize
            ),
            tileKey,
            tileSize,
            imgSize
          )
        }
       }

      const innerColumns = Math.floor(imgSize.w / tileSize) - 2 //excludes end tiles
      //loops through the tileset and creates adjacency rules for each one
      for (let i = 1; i <= Object.keys(tileSet).length; i++){
        tileSet[i].generateAdjacencyRules(Object.values(tileSet), i, innerColumns)
      }

      let flattenedTileset = {} //object which will hold the tileset with no repetitions
      let newMapping = {}       //object which maps the old tile keys to the new tile keys

      //loops through the tileSet and looks for dupes, combines their adjacency rules and puts them in the flattenedTileset
      for (const tile of Object.values(tileSet)){
        let dupeFound = false //determines if there are two tiles with the same pixel matrix (exact same tiles)

        //goes through the new flattened tileset and check if the current tile is equal to any of them
        for (let [nK, val] of Object.entries(flattenedTileset)){
          if (dupeTile(val.grid, tile.grid)){ //if the current tile is a duplicate of another tile in the flat tileset
            //appends the adjecency rules of the current duplicate tile to the already existing tile in the flattened tileset
            flattenedTileset[nK].adjacencyRules.up.push(...tile.adjacencyRules.up)
            flattenedTileset[nK].adjacencyRules.down.push(...tile.adjacencyRules.down)
            flattenedTileset[nK].adjacencyRules.left.push(...tile.adjacencyRules.left)
            flattenedTileset[nK].adjacencyRules.right.push(...tile.adjacencyRules.right)
            dupeFound = true
            newMapping[tile.k.toString()] = nK.toString() //adds an entry to the map the links the old key with the new key
            flattenedTileset[nK].frequencyHint += 1       //increases the frequency hint of the tile
          }
        }
        if (!dupeFound){
          let newTile = JSON.parse(JSON.stringify(tile))        //creates a copy of the tile to prevent changes to the original object
          newTile.k = Object.values(flattenedTileset).length+1  //initialises a new key for the tile
          flattenedTileset[newTile.k.toString()] = newTile      //adds the key-value pair of k and the tile into the flattened tileset
          newMapping[tile.k.toString()] = newTile.k.toString()  //maps the old tile key to the new tile key
        }

      }

      //updates all of the keys (which identify the tiles) in the adjacency rules to the new keys in the flattened tileset
      for (let [t, tile] of Object.entries(flattenedTileset)){
        for (let [d, dir] of Object.entries(tile.adjacencyRules)){
          for (let [a, n] of Object.entries(dir)){
            flattenedTileset[t].adjacencyRules[d][a] = newMapping[n]
          }
          flattenedTileset[t].adjacencyRules[d] = [...new Set(flattenedTileset[t].adjacencyRules[d])] //removes duplicates in adjacency rules
        }
      }
      tileSet = flattenedTileset
      resolve(tileSet)
    })
  })
}


async function generateTileset(input, dimensions, tile) {
  const imgSize = {                       //dimensions of the image
    w: dimensions.width,
    h: dimensions.height
  }
  let tileSet = {}                        //key: tile key, value: tile object
  const tileSize = parseInt(tile)         //size of the tile (integer value)
  tileSet = await getPixelValues(input, tileSize, tileSet, imgSize)
  return tileSet
}

export default generateTileset
