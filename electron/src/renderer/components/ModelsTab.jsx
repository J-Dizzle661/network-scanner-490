//simple array of the models available, can be changed whenever 
export const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];
import magGlass from "./images/magGlass.svg";

//ML models will be treated as objects to track their attributes
function MLModel(name){
    this.name = name;
    this.accuracy = null;
    this.inferTime = null;
    this.f1score = null;
    this.totFlows = null;
}

//This array contains the models from above, but in object form
const MLModels = models.map((model)=> new MLModel(model));
//Takes the array above and converts to JSX
const modelsListJSX = MLModels.map((model)=>{
    console.log(model.name);
    return (
            <li id={model.name} className="modelTile" key={model.name}>
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
                    </div>
                </div>
            </li>
    );
});

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
    return (
        <ul id="modelTilesList">
            {modelsListJSX}
        </ul>
    );
}

const ModelsSearchBar = ()=>{
    return (
        <div id="innerModelSearch">
            <object className="magGlass" data={magGlass} type="image/svg+xml"></object>
            <input type="search" placeholder="Search" id="smallSearchBar"/>
        </div>
    );
}
