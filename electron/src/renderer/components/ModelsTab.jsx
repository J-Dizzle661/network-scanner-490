//simple array of the models available, can be changed whenever 
export const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];
import magGlass from "./images/magGlass.svg";
import { useState } from "react";

//ML models will be treated as objects to track their attributes
function MLModel(name){
    this.name = name;
    this.state = 'Inactive';
    this.accuracy = null;
    this.inferTime = null;
    this.f1score = null;
    this.totFlows = null;

    this.activate = ()=>{
        modelsMap.get(currentActiveModel).deactivate();
        this.state = 'Active';
        currentActiveModel = this.name;
        //add the code to activate the model here later
    }
    this.deactivate = ()=>{
        this.state = 'Inactive';
        //add the code to deactivate the model here later
    }
}

//This array contains the models from above, but in object form
let currentActiveModel = 'Random Forest';
const MLModels = models.map((model)=> new MLModel(model));
const modelsMap = new Map();

export const ModelsTab = ()=>{
    return(
        <>
            <b>
                <h1 id="modelsTabHeader">Models</h1>
            </b>
            <ModelsSearchBar/>
            <Tiles/>
        </>
    );
}
const Tiles = ()=>{
    //takes the MLModels array and makes indiviual tiles for each model
    const modelsListJSX = MLModels.map((model)=>{
    const [modelState, setModelState] = useState(model.state);
    modelsMap.set(model.name, model);
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
                        <button className="activateModelButton" style = {{backgroundColor: model.state === 'Active' ? 'lightgrey' : 'lightblue'}} onClick={() => setModelState(model.activate())}>
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
