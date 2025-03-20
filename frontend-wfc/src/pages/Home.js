import React, {useState, useRef} from "react"
import s from "./Home.module.css"
import axios from "axios"
import Card from "../components/Card"
import FormWrapper from "../components/FormWrapper"
import ImagePlaceholder from "../components/ImagePlaceholder"
import { saveAs } from "file-saver"
function Home() {
  const [imgFile, setImgFile] = useState()            //input image file
  const [imgFileName, setImgFileName] = useState()    //filename of the input image
  const [imgPreview, setImgPreview] = useState()      //source url for the input image
  const imgFileRef = useRef(null)                     //file ref that will be maintained between renders
  const [outUrl, setOutUrl] = useState()              //output image source url
  const [generating, setGenerating] = useState(false) //whether the image is generating
  const [vidUrl, setVidUrl] = useState()              //output video source url
  const [tileSize, setTileSize] = useState()          //size of each tile in the image
  const [gridSize, setGridSize] = useState()          //size of the output grid (in tiles)

  //when the input file is changed
  function fileChange(event) {
    //if there is a file selected
    if (event.target.files.length > 0) {
      const inputFile = event.target.files[0] //gets the file from the event data
      //doesn't allow the input if it isn't a png
      if (event.target.files[0].type != "image/png") {
        alert("invalid file type. (Must be a PNG)")
        return
      }
      setImgFile(inputFile) //sets the image file variable to this file
      setImgFileName(inputFile.name)  //sets the image file name variable to this filename
      setImgPreview(URL.createObjectURL(inputFile)) //sets the image preview URL to a new url of this input
    }
  }

  //detects when the tile size input form is changed, and applies the changes
  function tileSizeChange(event) {
    setTileSize(event.target.value)
  }
  //detects when the grid size input form is changed, and applies the changes
  function gridSizeChange(event) {
    setGridSize(event.target.value)
  }

  //called when an image is added
  async function runWFC() {
    //alerts user if no tile has been detected when the WFC is run
    if (!imgFile) {
      alert("No file selected")
      return
    }

    //prevents the user from trying to collapse an image before the previous one has been completed
    if (generating) {
      alert("Currently generating image. Please wait until this one is finished")
      return
    }

    setVidUrl(null)     //resets the output video
    setGenerating(true) //says that generation has begun

    //adds all of the required data to the POST request
    const formData = new FormData()
    formData.append("image", imgFile)
    formData.append("tileSize", tileSize)
    formData.append("gridSize", gridSize)

    //calls the backend API for a post request to send the image and required data for processing
    axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => {
        setOutUrl(res.data.imgUrl)  //sets the image url to the value in the response

        if (!res.data.vidUrl) {
          alert("Video generation timed out. Displaying image instead")
          setVidUrl(res.data.imgUrl)  //sets the output to the still image if the video creation failed
        } else {
          setVidUrl(res.data.vidUrl)  //sets the video url to the value in the response
        }
        setGenerating(false)
      }).catch((err) => {
        //sends an alert if there is an error response
        if (err.response){
          console.error("Error uploading image:", err.response.data)
          alert(`Res status 500: An error occurred while uploading the image\n ${err.response.data}`)
        } else {
          alert(`Res status 500: An error occurred while uploading the image\n ${err}`)
        }
        setGenerating(false)
      })
  }

  //downloads the file from the specified url
  function download(url) {
    if (url) {
      saveAs(url, "output")
    } else {
      alert("No output generated")
    }
  }

  //prevents the user from putting a value outside of the allowed range in the form
  function enforceRange(min, max, e) {
    const val = e.target.value
    //checks if there was an input
    if (val != "") {
      if (parseInt(val) < min) {
        e.target.value = min //sets the value to the minimum if it is below
      } else if (parseInt(val) > max) {
        e.target.value = max //sets the value to the maximum if it is above
      }
    }
  }

  return (
    <div className={s.main}>
      <div className={s.title}>
        <img src="https://kopawz.neocities.org/indexgraphics/notfoundfolder/spinningfrog.gif" />
        <h1 className={s.title_text}>WFC Image generator</h1>
        <img src="https://kopawz.neocities.org/indexgraphics/notfoundfolder/spinningfrog.gif" />
      </div>

      <div className={s.content_wrapper}>
        <Card>
          <h2 className={s.secondary_title}>Input</h2>
          <div className={s.img_wrapper}>
            {imgPreview ? (
              <img src={imgPreview} alt="forest" className={s.input} />
            ) : (
              <ImagePlaceholder/>
            )}
          </div>
          <div className={s.input_file_wrapper}>
            <input type="file" accept="image/png" onChange={fileChange} className={s.input_file} ref={imgFileRef} />
            <button onClick={() => imgFileRef.current.click()} className={s.input_file_button}>Choose File</button>
            <span className={s.input_file_text}>{imgFileName}</span>
          </div>
          <div className={s.input_vals}>
            <FormWrapper  name="Tile Size">
              <input type="number" onChange={tileSizeChange} className={s.input_form} min="1" max="64" onKeyUp={(e) => { enforceRange(1, 64, e) }} placeholder="1-64"/>
            </FormWrapper>
            <FormWrapper  name="Output Grid Size (Tiles)">
              <input type="number" onChange={gridSizeChange} className={s.input_form} min="1" max="50" onKeyUp={(e) => { enforceRange(1, 50, e) }} placeholder="1-50" />
            </FormWrapper>
            <button onClick={addFile} className={s.begin_button}>
              BEGIN WFC
            </button>
          </div>
        </Card>

        <Card>
          <h2 className={s.secondary_title}>Output</h2>
          <div className={s.img_wrapper}>
            {vidUrl ? (
              <video src={vidUrl} alt="forest" className={s.output} autoPlay={true} />
            ) : (
                <ImagePlaceholder isLoading={generating} />
            )}
          </div>
          <button onClick={() => download(outUrl)} className={s.download_button}>
              DOWNLOAD
          </button>
          <button onClick={() => download(vidUrl)} className={s.download_button}>
              DOWNLOAD VIDEO
          </button>
        </Card>
      </div>
    </div>
  )
}

export default Home