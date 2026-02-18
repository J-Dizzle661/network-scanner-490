import magGlass from "./images/magGlass.svg";
import { useState } from "react";
import { MLModels } from "../../main/models.js";

export const ModelsTab = ({setSelectedTab})=>{
    return(
        <>
            <b>
                <h1 id="modelsTabHeader">Models</h1>
            </b>
            <ModelsSearchBar/>
            <Tiles setSelectedTab={setSelectedTab}/>
        </>
    );
}
const Tiles = ({setSelectedTab})=>{
    //takes the MLModels array and makes indiviual tiles for each model
    const modelsListJSX = MLModels.map((model)=>{
    return (
            <li id={model.name} className="modelTile" key={model.name}>
                <div className="modelStateBox" style={{backgroundColor: model.state === 'Active' ? 'lightgreen' : 'lightgrey'}}><p>{model.state}</p></div>
                <div className="modelInfoContainer">
                    <b>
                        <h2 className="modelName">{model.name}</h2>
                    </b>
                    <div>
                        <ul className="modelStats" >
                            <li>Accuracy: {model.accuracy}</li>
                            <li>Inference Time: {model.inferTime}</li>
                            <li>F1 Score: {model.f1score}</li>
                            <li>Total Flows: {model.totFlows}</li>
                        </ul>
                        <button className="activateModelButton" style = {{backgroundColor: model.state === 'Active' ? 'lightgrey' : 'lightblue'}} onClick={() => {
                                if (model.state ==='Inactive'){
                                    model.activate();
                                    setSelectedTab(<ModelsTab setSelectedTab={setSelectedTab}/>);
                                }
                                else{}
                            }}>
                            {model.state === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            </li>
        );
    });

    return (
        <div id ="scrollPane">
            <ul id="modelTilesList">
                {modelsListJSX}
            </ul>
        </div>
    );
}

const ModelsSearchBar = ()=>{
    return (
        <div id="innerModelSearch">
            <object className="magGlass" data={magGlass} type="image/svg+xml"></object>
            <input type="search" placeholder="Search Models" id="smallSearchBar"/>
        </div>
    );
}
