import React, {useState, useRef} from "react";
import s from "./Home.module.css"
import axios from "axios"
import Card from "../components/Card";
import FormWrapper from "../components/FormWrapper";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { saveAs } from "file-saver";
function Home() {
  const [imgFile, setImgFile] = useState()
  const [imgFileName, setImgFileName] = useState()
  const [imgPreview, setImgPreview] = useState()
  const imgFileRef = useRef(null);
  const [outUrl, setOutUrl] = useState()
  const [generating, setGenerating] = useState(false)
  const [vidUrl, setVidUrl] = useState()
  const [tileSize, setTileSize] = useState()
  const [gridSize, setGridSize] = useState()

  function fileChange(event) {
    if (event.target.files.length > 0) {
      const inputFile = event.target.files[0]
      setImgFile(inputFile)
      setImgFileName(inputFile.name)
      setImgPreview(URL.createObjectURL(inputFile))
    }
  }

  function tileSizeChange(event) {
    setTileSize(event.target.value)
  }
  function gridSizeChange(event) {
    setGridSize(event.target.value)
  }

  //called when an image is added
  async function addFile() {
    if (!imgFile) {
      alert("No file selected")
      return
    }

    if (generating) {
      alert("Currently generating image. Please wait until this one is finished")
      return
    }

    setVidUrl(null)     //resets the output gif
    setGenerating(true); //says that generation has begun

    //adds all of the required data to the POST request
    const formData = new FormData()
    formData.append("image", imgFile)
    formData.append("tileSize", tileSize)
    formData.append("gridSize", gridSize)

    //calls the backend API for a post request to send the image and required data for processing
    axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => {
        setOutUrl(res.data.imgUrl);  //sets the image url to the value in the response
        if (!res.data.vidUrl) {
          alert("Video generation timed out. Displaying image instead")
          setVidUrl(null);
        } else {
          setVidUrl(res.data.vidUrl);  //sets the gif url to the value in the response
        }
        setGenerating(false)
      }).catch((err) => {
        //sends an alert if there is an error response
        if (err.response){
          console.error("Error uploading image:", err.response.data);
          alert(`Res status 500: An error occurred while uploading the image\n ${err.response.data}`);
        } else {
          alert(`Res status 500: An error occurred while uploading the image\n ${err}`)
        }
        setGenerating(false)
      })
  }

  function downloadImg() {
    if (outUrl) {
      saveAs(outUrl, "output")
    } else {
      alert("No image generated")
    }
  }

  function downloadVideo() {
    if (vidUrl) {
      saveAs(vidUrl, "output")
    } else {
      alert("No video generated")
    }
  }

  function enforceRange(min, max, e) {
    const val = e.target.value
    if (val != "") {
      if (parseInt(val) < min) {
        e.target.value = min
      } else if (parseInt(val) > max) {
        e.target.value = max
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
            <input type="file" accept="image/*" onChange={fileChange} className={s.input_file} ref={imgFileRef} />
            <button onClick={() => imgFileRef.current.click()} className={s.input_file_button}>Choose File</button>
            <span className={s.input_file_text}>{imgFileName}</span>
          </div>
          <div className={s.input_vals}>
            <FormWrapper  name="Tile Size">
              <input type="number" onChange={tileSizeChange} className={s.input_form} onKeyUp={(e) => { enforceRange(1, 64, e) }} placeholder="1-64"/>
            </FormWrapper>
            <FormWrapper  name="Output Grid Size (Tiles)">
              <input type="number" onChange={gridSizeChange} className={s.input_form} onKeyUp={(e) => { enforceRange(1, 50, e); }} placeholder="1-50" />
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
          <button onClick={downloadImg} className={s.download_button}>
              DOWNLOAD
          </button>
          <button onClick={downloadVideo} className={s.download_button}>
              DOWNLOAD VIDEO
          </button>
        </Card>
      </div>
    </div>
  );
}

export default Home