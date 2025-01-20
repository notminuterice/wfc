import React, {useState} from "react";
import s from "./Grid.module.css"
function Grid(props) {
    console.log(props)
    return(
        <div className={s.wrapper}>
            {Array(props.inputGridSize).map((a, i) => {
                return(
                  <div>{i}</div>
                )
            })}
        </div>
    )
}

export default Grid