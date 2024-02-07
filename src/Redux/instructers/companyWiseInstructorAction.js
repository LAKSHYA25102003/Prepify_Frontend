import { fetchInstructorsFail,fetchInstructorsLoading,fetchInstructorSuccess } from "./companyWiseInstructorSlice";
import {companyWiseFetchInstructor} from "../../APIs/Instructer_API"
import { decryptFromJson, encryptToJson } from "../../Utils/functions";

export const fetchCompanyWiseInstructors=(data)=> async (dispatch,getState)=>{
    try{
        dispatch(fetchInstructorsLoading());
        data["page"]=1;
        data["limit"]=6;
        const fetchId=encryptToJson(data);
        const instructers = await companyWiseFetchInstructor(localStorage.getItem("token"),fetchId);
        const decryptedInstructers = decryptFromJson(instructers.payload);
        console.log(decryptedInstructers);
        
    }
    catch(error)
    {
        console.log(error);
    }
}