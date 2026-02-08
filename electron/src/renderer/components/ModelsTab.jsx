import { GlobalElems } from "./Global.jsx";

//simple array of the models available, can be changed whenever 
export const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];

//ML models will be treated as objects to track their attributes
const MLModel = (name) =>{
    this.name = name;
    this.accuracy = null;
    this.inferTime = null;
    this.f1score = null;
    totFlows = null;
}

//This array contains the models from above, but in object form
const MLModels = models.map((model)=> new MLModel(model));
//Takes the array above and converts to JSX
const modelsListJSX = MLModels.map((model)=>{
    return (
        <li id={model.name} className="modelTile"/>
    );
});

export const ModelsTab = ()=>{
    return(
        <>
            <GlobalElems/>
            <Tiles/>
        </>
    );
}
const Tiles = ()=>{
    return (
        <ul id="modelTiles">
            {modelsListJSX}
        </ul>
    );
}
