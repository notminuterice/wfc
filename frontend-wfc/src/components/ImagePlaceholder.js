import React from "react"
import s from "./ImagePlaceholder.module.css"
import CSSWave from "./CSSWave"
function ImagePlaceholder(props) {
    return (
        <div className={s.container}>
            <CSSWave />
            <div className={s.glass}></div>
            {props.isLoading ? (
                <text className={s.info_text}>Generating Output...</text>
            ): (
                <text className={s.info_text}>No Image Found</text>
            )}
        </div>
    )
}

export default ImagePlaceholder