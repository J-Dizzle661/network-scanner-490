//simple array of the models available, can be changed whenever 
export const models = ['Random Forest', 'Isolation Forest', 'SVM', 'MLP','Logistic Regression'];

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
        return this.state;
        //add the code to activate the model here later
    }
    this.deactivate = ()=>{
        this.state = 'Inactive';
        //add the code to deactivate the model here later
    }
}

//This array contains the models from above, but in object form
export let currentActiveModel = 'Random Forest';
export const MLModels = models.map((model)=> new MLModel(model));
export const modelsMap = new Map();
MLModels.forEach(model => {
    modelsMap.set(model.name, model);
});

//starts the app with Random Forest as the default model
modelsMap.get(currentActiveModel).activate();
console.log("i made it here");