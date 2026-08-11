import {
    useEffect,
    useState
} from "react";


import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";


import {
    db
} from "../../firebase/firebaseConfig";


import {
    useAuth
} from "../../context/AuthContext";


import "./ResumeUpload.css";



function ResumeUpload(){


    const { user } = useAuth();



    const [resumeURL,setResumeURL] = useState("");

    const [saving,setSaving] = useState(false);







    useEffect(()=>{


        if(user){

            loadResume();

        }


    },[user]);









    const loadResume = async()=>{


        try{


            const snap = await getDoc(


                doc(

                    db,

                    "studentProfiles",

                    user.uid

                )


            );



            if(snap.exists()){


                setResumeURL(


                    snap.data().resumeURL || ""

                );


            }



        }


        catch(error){


            console.log(
                "Load Resume Error:",
                error
            );


        }


    };









    const saveResume = async()=>{


        if(!user){


            alert(
                "Please login first"
            );


            return;


        }






        if(!resumeURL){


            alert(
                "Please paste your resume link"
            );


            return;


        }







        try{


            setSaving(true);






            await setDoc(


                doc(

                    db,

                    "studentProfiles",

                    user.uid

                ),


                {


                    uid:user.uid,


                    name:user.name || "",


                    email:user.email || "",


                    resumeURL:resumeURL,


                    updatedAt:serverTimestamp()



                },


                {


                    merge:true


                }


            );







            alert(
                "Resume link saved successfully"
            );




        }


        catch(error){


            console.log(
                "Save Resume Error:",
                error
            );


            alert(
                error.message
            );


        }


        finally{


            setSaving(false);


        }



    };









    return(



        <div className="resume-upload">


            <div className="resume-card">





                <h1>
                    Upload Resume
                </h1>





                <p>
                    Paste your public resume link
                </p>








                <input


                    className="resume-input"


                    type="url"


                    placeholder="Paste Google Drive resume link"


                    value={resumeURL}


                    onChange={(e)=>

                        setResumeURL(
                            e.target.value
                        )

                    }


                />









                <button


                    className="upload-btn"


                    onClick={saveResume}


                    disabled={saving}


                >


                    {


                    saving

                    ?

                    "Saving..."

                    :

                    "Save Resume"


                    }



                </button>









                {


                resumeURL &&



                <div className="resume-preview">





                    <span>

                        ✅ Resume Added

                    </span>






                    <a


                        href={resumeURL}


                        target="_blank"


                        rel="noopener noreferrer"


                        className="resume-btn"


                    >


                        View Resume


                    </a>






                </div>



                }





            </div>


        </div>


    );


}


export default ResumeUpload;