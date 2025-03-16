import React, {useState} from "react";
import s from "./Home.module.css"
import axios from "axios"
import Card from "../components/Card";
import FormWrapper from "../components/FormWrapper";
import ImagePlaceholder from "../components/ImagePlaceholder";
import { saveAs } from "file-saver";
function Home() {
  const [imgFile, setImgFile] = useState()
  const [imgPreview, setImgPreview] = useState()
  const [outUrl, setOutUrl] = useState()
  const [outName, setOutName] = useState()
  const [generating, setGenerating] = useState(false)
  const [gifUrl, setGifUrl] = useState()
  const [tileSize, setTileSize] = useState()
  const [gridSize, setGridSize] = useState()

  function fileChange(event) {
    if (event.target.files.length > 0) {
      const inputFile = event.target.files[0]
      setImgFile(inputFile)
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

    setGifUrl(null)     //resets the output gif
    setGenerating(true); //says that generation has begun

    //adds all of the required data to the POST request
    const formData = new FormData()
    formData.append("image", imgFile)
    formData.append("outPath", outName)
    formData.append("tileSize", tileSize)
    formData.append("gridSize", gridSize)

    //calls the backend API for a post request to send the image and required data for processing
    axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((res) => {
        setOutUrl(res.data.imgUrl)  //sets the image url to the value in the response
        setGifUrl(res.data.gifUrl)  //sets the gif url to the value in the response
      }).catch((err) => {
        //sends an alert if there is an error response
        if (err.response){
          console.error("Error uploading image:", err.response.data);
          alert(`Res status 500: An error occurred while uploading the image\n ${err.response.data}`);
        } else {
          alert(`Res status 500: An error occurred while uploading the image\n ${err}`)
        }
      })
  }

  function downloadFile() {
    saveAs(outUrl, outName)
  }

  function nameChange(event) {
    setOutName(event.target.value)
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
          <input type="file" accept="image/*" onChange={fileChange} className={s.input_file} />
          <div className={s.input_vals}>
            <FormWrapper name="Output Filename">
              <input type="text" onChange={nameChange} className={s.input_form} placeholder="filename"/>
            </FormWrapper>
            <FormWrapper  name="Tile Size">
              <input type="number" onChange={tileSizeChange} className={s.input_form} placeholder="0"/>
            </FormWrapper>
            <FormWrapper  name="Output Grid Size">
              <input type="number" onChange={gridSizeChange} className={s.input_form} placeholder="0"/>
            </FormWrapper>
            <button onClick={addFile} className={s.begin_button}>
              BEGIN WFC
            </button>
          </div>
        </Card>

        <Card>
          <h2 className={s.secondary_title}>Output</h2>
          <div className={s.img_wrapper}>
            {gifUrl ? (
              <img src={gifUrl} alt="forest" className={s.output} />
            ) : (
                <ImagePlaceholder isLoading={generating} />
            )}
          </div>
          <button onClick={downloadFile} className={s.download_button}>
              DOWNLOAD
          </button>
        </Card>
      </div>
    </div>
  );
}

export default Home