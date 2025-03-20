import React from "react"
import s from "./Card.module.css"
function Card(props) {
    return(
        <div className={s.wrapper}>
            {props.children}
        </div>
    )
}

export default Card