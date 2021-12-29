const maturity_question= require('../../models/maturity_questions');
const maturity_records = require('../../models/maturity_record');
const maturity_recommendation = require('../../models/maturity_recommendation');
const applications = require('../../models/application');
const maturity_questions = require('../../models/maturity_questions');
const generate_category_key = require('../../service_helpers/generate_key')
module.exports = {


    application_maturity: async(application_key)=>{
        try{
            let fetched_maturity = await maturity_records.findOne({'application_key':application_key},{_id:0}).lean();
            if(fetched_maturity==null){
                let questions = await get_questions();
                return ({
                    "application_key":application_key,
                    "categories":questions,
                });
            }
            else{
                return fetched_maturity;
            }
        }
        catch(error){
            throw new Error(error.message);
        }
    },
    all_maturity_data: async()=>{
        try{

            let questions = await get_questions();
                return ({

                    "categories":questions
                });


        }
        catch(error){
            throw new Error(error.message);
        }
    },
    save_maturity:async(maturity_details)=>{
        try{
           await maturity_records.deleteOne({'application_key':maturity_details.application_key});
           let maturity_object = new maturity_records(maturity_details);
           await maturity_records.create(maturity_object);
           return "Maturity record saved successfully";
        }
        catch(error){
            throw new Error(error.message);
        }
    },

    recommendation: async(maturity_index)=>{
        try{
            let maturity_level=0;
            if (maturity_index < 0.60) {
                maturity_level = 0;
              }
              else if (maturity_index > 0.59 && maturity_index < 0.80) {
                maturity_level = 1;

              }
              else if (maturity_index > 0.79 && maturity_index < 0.90) {
                maturity_level = 2;

              }
              else if (maturity_index > 0.89) {
                maturity_level = 3;
              }
              else{
                  throw new Error("maturity index beyond limits");
              }

            let recommendation_object = await maturity_questions.find({},{ category_recommendations: { $elemMatch: { mi_level: maturity_level }},category_name:1})

            return recommendation_object;
           }
        catch(error){
            throw new Error(error.message);
        }
    },
    save_category_maturity:async(maturity_details)=>{


        try{

            let question_weight = 100/maturity_details.category_questions.length

            let question_weigth_inpercent = question_weight/100

            // await maturity_details.category_questions.forEach((question,index) => {
            //     let answer_option_length = question.answer_options.length
            // question.answer_options.forEach((answer_option,index) => {
            //         answer_option.option_weight = (question_weigth_inpercent/answer_option_length)*(index+1);
            //     });
            // });
            for(let question of maturity_details.category_questions){
                let answer_option_length = question.answer_options.length
                question.answer_options.filter((answer_option,index) => {
                            answer_option.option_weight = (question_weigth_inpercent/answer_option_length)*(index+1);
                        });

                }

            maturity_details.category_key = generate_category_key.generateMaturityKey(maturity_details.category_name);

          await maturity_questions.create(maturity_details);
           return "New Category added successfully";
        }
        catch(error){

            throw new Error(error.message);

        }
    },

    update_category_questions_maturity:async(maturity_details)=>{
        try{



         await maturity_questions.findOne(
            {"category_name" : maturity_details.category_name}
           )

           await maturity_questions.findOneAndUpdate(
                {"category_name" : maturity_details.category_name },
                { $push: { "category_questions": maturity_details.category_questions } }, );
            return "New Question added successfully";
           }


        catch(error){
            throw new Error(error.message);
        }
    },
    update_category_questions_answers_maturity:async(maturity_details)=>{
        try{


          await maturity_questions.findOneAndUpdate(
               {"category_name" : maturity_details.category_name},
               { $push: { "category_questions": maturity_details.questions } }, {
                new: true,
                upsert: true


           });
           return "New Category added successfully";
        }
        catch(error){
            throw new Error(error.message);
        }
    },
    pdf_data: async(application_key)=>{
        try{
            let application_name="";
            let maturity_scores=[];
            let maturity_questions;
            let total_maturity=0;
            let maturity_index=0;
            let maturity_level=0;
            let fetched_applicaiton = await applications.findOne({'application_key':application_key},{'application_name':1}).lean();
            if(fetched_applicaiton==null){
                throw new Error("application not found");
            }
            else{
                application_name= fetched_applicaiton.application_name;
                let fetched_maturity = await maturity_records.findOne({'application_key':application_key}).lean();
               if(fetched_maturity==null){
                throw new Error("maturity record not found for this application");
               }
               else{
                    for await (let category of fetched_maturity.categories){
                        let temp_maturity=category.category_weights.reduce(function (a, b) {
                            return a + b;
                          },
                          0);
                        total_maturity+=temp_maturity;
                        let category_obj={
                            "category_name":category.category_name,
                            "category_score":temp_maturity
                        };
                        maturity_scores.push(category_obj);
                    }
                    maturity_index=total_maturity/5;
                    maturity_index= Math.round((maturity_index + Number.EPSILON) * 10) / 10
                    let questions=[];
                    let answers =[];
                    for await(let category of fetched_maturity.categories){
                        let category_selections= category.category_selections;

                        for await (let question of category.category_questions){
                            let index=0;
                            questions.push(question.question);
                            if(category_selections[index]>0){
                                answers.push(question.answer_options[category_selections[index]].option_value);
                            }
                            else{
                                answers.push("Not Answered");
                            }
                            index++;
                        }
                    }
                    let maturity_questions = {
                        "questions":questions,
                        "answers":answers
                    };

                    let fetched_recommendation = await this.recommendation(maturity_index);
                    maturity_level=fetched_recommendation.mi_level;
                    return {
                        "application_name":application_name,
                        "maturity_level":maturity_level,
                        "maturity_scores":maturity_scores,
                        "maturity_questions":maturity_questions,
                        "recommendations":fetched_recommendation
                    };

               }
            }
        }
        catch(error){
            throw new Error(error.message);
        }
    },
    get_existing_weights: async(category_body)=>{

        try{

            let weight_array = [];
            let maturity_data = await maturity_question.findOne({"category_name": category_body.category_name})
            let category_questions = maturity_data.category_questions
            // await category_body.question.forEach((req, index) =>{
            //      category_questions.forEach((question, index) =>{
            //         question.answer_options.forEach((answer_option, index) =>{
            //            if( req.answer_options == answer_option.option_value )
            //            {
            //             let weight_object = {
            //                 "answer_option": req.answer_options,
            //                 "weight":answer_option.option_weight

            //             }
            //             weight_array.push(weight_object)

            //            }

            //         })
            //     })
            // })
            for await(let req of category_body){

                for(let question of category_questions){

                     for(let answer_option of  question.answer_options ){
                        if( req.answer_options == answer_option.option_value )
                        {
                         let weight_object = {
                             "answer_option": req.answer_options,
                             "weight":answer_option.option_weight

                         }
                         weight_array.push(weight_object)

                        }

                     }

                }

            }

            return weight_array
        }
        catch(error){
            throw new Error(error.message);
        }
    },

    update_category_questions: async(category_body)=>{

        try
        {
            let maturity_data = await maturity_question.findOne({"category_name": category_body.category_name})

            let updated_maturity_array=[];
            // await maturity_data.category_questions.forEach((question, index) =>{
            //     updated_maturity_array.push(question)
            // })
            for await (let question of  maturity_data.category_questions){
                updated_maturity_array.push(question)
            }
            // await category_body.category_questions.forEach((question, index) =>{
            //     updated_maturity_array.push(question)

            // })
            for await (let question of category_body.category_questions){
                updated_maturity_array.push(question)

            }
            let updated_maturity_object = {
                "category_name": category_body.category_name,
                "category_questions":updated_maturity_array
            }



            let question_weight = 100/updated_maturity_object.category_questions.length

            let question_weigth_inpercent = question_weight/100

            await updated_maturity_object.category_questions.filter((question,index) => {
                let answer_option_length = question.answer_options.length
            question.answer_options.filter((answer_option,index) => {
                    answer_option.option_weight = (question_weigth_inpercent/answer_option_length)*(index+1);
                });
            });

            await maturity_question.findOneAndUpdate({"category_name": category_body.category_name},{"category_questions": updated_maturity_object.category_questions},
            {new:true, upsert:true})
                return "Maturity Questions Updated Successfully"
                }

                        catch(error){
            throw new Error(error.message);
        }
    }

}

const get_questions = async() => {
    try{
        let questions= await maturity_question.find({},{_id:0}).lean();
        return questions;
    }
    catch(error){
        throw new Error(error.message);
    }
}