//simple array of the models available, can be changed whenever 
export const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];

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
        <li id={model.name} className="modelTile" key={model.name}><h1>{model.name}</h1></li>
    );
});

export const ModelsTab = ()=>{
    return(
        <>
            <Tiles/>
            <h1>Yeah Buddy!</h1>
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
