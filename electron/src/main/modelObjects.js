export const models = [
                        {'Random Forest' : [90, 90, 90, 90, 0.1018, 'high', 'high']}, 
                        {'Logistic Regression' : [87, 86, 85, 82, 0.0061, 'high', 'high']}, 
                        {'Support Vector Machine' : [80, 85, 80, 80, 0.0029, 'low', 'low']}, 
                        {'Multilayer Perceptron' : [88, 85, 87, 85, 0.0054, 'moderate', 'moderate' ]},
                        {'Isolation Forest' : [20, 80, 22, 20, 0.0128, 'very high', 'very high']}
                    ];

//ML models will be treated as objects to track their attributes
function MLModel(name, statsList){
    this.name = name;
    this.state = 'Inactive';
    this.accuracy = statsList[0];
    this.precision = statsList[1];
    this.recall = statsList[2];
    this.f1 = statsList[3];
    this.inferTime = statsList[4];
    this.cpu = statsList[5];
    this.mem = statsList[6];

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
export const MLModels = models.map((model)=> new MLModel(Object.keys(model)[0], model[Object.keys(model)[0]]));
export const modelsMap = new Map();
MLModels.forEach(model => {
    modelsMap.set(model.name, model);
});

//starts the app with Random Forest as the default model
modelsMap.get(currentActiveModel).activate();