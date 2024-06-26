import { DecryptResponseData } from "../Utils/Encryption/DecryptResponseData";
import { EncryptRequestData } from "../Utils/Encryption/EncryptRequestData";


const BASE_URL = process.env.REACT_APP_BASE_URL

export const getAllMeetings = async (meetings) => {

    try {
        
        const DATA = EncryptRequestData({meetingIdArray:meetings})

        const response = await fetch(BASE_URL+"/meetings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "security-key": process.env.REACT_APP_SECURITY_KEY
            },
            body:
                JSON.stringify(DATA),
        })

        let json = await response.json();
        json = DecryptResponseData(json)

        return json;

    } catch (err) {

        return { success: false, msg: err.toString() }
    }
}


export const getUserMeetings = async (page, limit, type) => {

    try {

        const response = await fetch(BASE_URL+"/meetings"+`?page=${page}&limit=${limit}&type=${type}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "security-key": process.env.REACT_APP_SECURITY_KEY,
                "auth-token": localStorage.getItem("token")
            }
        })

        let json = await response.json();
        json = DecryptResponseData(json)

        return json;

    } catch (err) {

        return { success: false, msg: err.toString() }
    }
}


