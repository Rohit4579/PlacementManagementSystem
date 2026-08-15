import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    doc,
    getDoc,
    setDoc
} from "firebase/firestore";

import {
    db
} from "../../firebase/firebaseConfig";

import {
    useAuth
} from "../../context/AuthContext";

import {
    FaUserGraduate,
    FaEnvelope,
    FaPhone,
    FaBuilding,
    FaUniversity,
    FaChartLine,
    FaGraduationCap,
    FaCode,
    FaCalendarAlt,
    FaSave,
    FaCheckCircle,
    FaCamera,
    FaCloudUploadAlt,
    FaTrash,
    FaTimes,
    FaExpand,
    FaEye,
    FaSyncAlt
} from "react-icons/fa";

import "./StudentProfile.css";


function StudentProfile() {

    const { user } = useAuth();


    /* =========================================================
       CLOUDINARY
    ========================================================= */

    const CLOUDINARY_CLOUD_NAME =
        "dvwp93vai";

    const CLOUDINARY_UPLOAD_PRESET =
        "student_profile_photos";


    /* =========================================================
       PROFILE STATE
    ========================================================= */

    const [profile, setProfile] = useState({

        phone: "",

        collegeName: "",

        degree: "",

        department: "",

        tenthPercentage: "",

        twelfthPercentage: "",

        cgpa: "",

        skills: "",

        graduationYear: "",

        profilePhotoURL: "",

        profilePhotoPublicId: ""

    });


    const [loading, setLoading] =
        useState(false);

    const [fetching, setFetching] =
        useState(true);

    const [successMessage, setSuccessMessage] =
        useState("");

    const [photoUploading, setPhotoUploading] =
        useState(false);


    /* =========================================================
       LOCAL PHOTO PREVIEW
    ========================================================= */

    const [localPhotoPreview, setLocalPhotoPreview] =
        useState("");


    /* =========================================================
       PHOTO VIEWER
    ========================================================= */

    const [showPhotoViewer, setShowPhotoViewer] =
        useState(false);


    /* =========================================================
       CAMERA STATE
    ========================================================= */

    const [showCamera, setShowCamera] =
        useState(false);

    const [cameraLoading, setCameraLoading] =
        useState(false);

    const [cameraError, setCameraError] =
        useState("");

    const [capturedPhoto, setCapturedPhoto] =
        useState("");


    /* =========================================================
       PEXELS CAREER / EDUCATION IMAGE
       Decorative only - does not affect profile logic.
    ========================================================= */

    const [careerImage, setCareerImage] = useState("");
    const [careerPhotographer, setCareerPhotographer] = useState("");
    const [careerPhotographerUrl, setCareerPhotographerUrl] = useState("");
    const [careerPexelsUrl, setCareerPexelsUrl] = useState("");
    const [careerImageLoading, setCareerImageLoading] = useState(true);


    useEffect(() => {

        let cancelled = false;

        const loadCareerImage = async () => {

            const apiKey = import.meta.env.VITE_PEXELS_API_KEY;

            if (!apiKey) {
                setCareerImageLoading(false);
                return;
            }

            try {

                const response = await fetch(
                    "https://api.pexels.com/v1/search?query=college%20student%20career%20education&orientation=landscape&per_page=10",
                    {
                        headers: {
                            Authorization: apiKey
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error(`Pexels request failed: ${response.status}`);
                }

                const data = await response.json();

                if (cancelled || !data?.photos?.length) {
                    return;
                }

                const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 6))];

                if (!photo) {
                    return;
                }

                setCareerImage(
                    photo.src?.large2x ||
                    photo.src?.large ||
                    photo.src?.original ||
                    ""
                );

                setCareerPhotographer(photo.photographer || "Pexels");
                setCareerPhotographerUrl(photo.photographer_url || "https://www.pexels.com/");
                setCareerPexelsUrl(photo.url || "https://www.pexels.com/");

            } catch (error) {
                console.error("Student Profile Pexels image error:", error);
            } finally {
                if (!cancelled) {
                    setCareerImageLoading(false);
                }
            }
        };

        loadCareerImage();

        return () => {
            cancelled = true;
        };

    }, []);


    /* =========================================================
       CAMERA REFS
    ========================================================= */

    const videoRef =
        useRef(null);

    const canvasRef =
        useRef(null);

    const cameraStreamRef =
        useRef(null);


    /* =========================================================
       FETCH STUDENT PROFILE
    ========================================================= */

    useEffect(() => {

        const fetchProfile = async () => {

            if (!user?.uid) {

                setFetching(false);

                return;

            }


            try {

                const profileRef =
                    doc(
                        db,
                        "studentProfiles",
                        user.uid
                    );


                const profileSnap =
                    await getDoc(
                        profileRef
                    );


                if (profileSnap.exists()) {

                    const data =
                        profileSnap.data();


                    setProfile({

                        phone:
                            data.phone || "",

                        collegeName:
                            data.collegeName || "",

                        degree:
                            data.degree || "",

                        department:
                            data.department || "",

                        tenthPercentage:
                            data.tenthPercentage || "",

                        twelfthPercentage:
                            data.twelfthPercentage || "",

                        cgpa:
                            data.cgpa || "",

                        skills:
                            data.skills || "",

                        graduationYear:
                            data.graduationYear || "",

                        profilePhotoURL:
                            data.profilePhotoURL || "",

                        profilePhotoPublicId:
                            data.profilePhotoPublicId || ""

                    });

                }

            }

            catch (error) {

                console.error(
                    "Fetch Profile Error:",
                    error
                );

            }

            finally {

                setFetching(false);

            }

        };


        fetchProfile();

    }, [user]);


    /* =========================================================
       CURRENT PHOTO
    ========================================================= */

    const currentPhoto =
        localPhotoPreview ||
        profile.profilePhotoURL;


    /* =========================================================
       HANDLE INPUT CHANGE
    ========================================================= */

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;


        setProfile(
            previous => ({

                ...previous,

                [name]: value

            })
        );


        setSuccessMessage("");

    };


    /* =========================================================
       COMPRESS IMAGE
    ========================================================= */

    const compressImage = (
        file,
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.84
    ) => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const image =
                    new Image();


                const objectURL =
                    URL.createObjectURL(
                        file
                    );


                image.onload = () => {

                    URL.revokeObjectURL(
                        objectURL
                    );


                    let width =
                        image.width;

                    let height =
                        image.height;


                    if (
                        width > maxWidth ||
                        height > maxHeight
                    ) {

                        const ratio =
                            Math.min(
                                maxWidth / width,
                                maxHeight / height
                            );


                        width =
                            Math.round(
                                width * ratio
                            );


                        height =
                            Math.round(
                                height * ratio
                            );

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;

                    canvas.height =
                        height;


                    const context =
                        canvas.getContext(
                            "2d"
                        );


                    context.imageSmoothingEnabled =
                        true;

                    context.imageSmoothingQuality =
                        "high";


                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );


                    canvas.toBlob(
                        (
                            blob
                        ) => {

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Unable to process image."
                                    )
                                );

                                return;

                            }


                            const compressedFile =
                                new File(
                                    [
                                        blob
                                    ],
                                    "profile-photo.webp",
                                    {
                                        type:
                                            "image/webp"
                                    }
                                );


                            resolve(
                                compressedFile
                            );

                        },
                        "image/webp",
                        quality
                    );

                };


                image.onerror = () => {

                    URL.revokeObjectURL(
                        objectURL
                    );


                    reject(
                        new Error(
                            "Unable to read selected image."
                        )
                    );

                };


                image.src =
                    objectURL;

            }
        );

    };


    /* =========================================================
       UPLOAD PROFILE PHOTO TO CLOUDINARY
    ========================================================= */

    const uploadPhotoFile = async (file) => {

        if (!file) {

            return;

        }


        if (!user?.uid) {

            throw new Error(
                "Please login before uploading a profile photo."
            );

        }


        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            throw new Error(
                "Please upload a JPG, PNG, or WebP image."
            );

        }


        const maxFileSize =
            5 * 1024 * 1024;


        if (
            file.size >
            maxFileSize
        ) {

            throw new Error(
                "Profile photo must be smaller than 5 MB."
            );

        }


        const oldPhoto =
            profile.profilePhotoURL;


        let temporaryURL = "";


        try {

            setPhotoUploading(true);

            setSuccessMessage("");


            /* =================================================
               LOCAL PREVIEW
            ================================================= */

            temporaryURL =
                URL.createObjectURL(
                    file
                );


            setLocalPhotoPreview(
                temporaryURL
            );


            /* =================================================
               COMPRESS
            ================================================= */

            const compressedFile =
                await compressImage(
                    file
                );


            /* =================================================
               CLOUDINARY FORM DATA
            ================================================= */

            const formData =
                new FormData();


            formData.append(
                "file",
                compressedFile
            );


            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            formData.append(
                "folder",
                "student-profile-photos"
            );


            /* =================================================
               CLOUDINARY UPLOAD
            ================================================= */

            const response =
                await fetch(

                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

                    {

                        method:
                            "POST",

                        body:
                            formData

                    }

                );


            const data =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Cloudinary Error:",
                    data
                );


                throw new Error(
                    data?.error?.message ||
                    "Unable to upload profile photo."
                );

            }


            const uploadedURL =
                data.secure_url;


            const publicId =
                data.public_id;


            if (!uploadedURL) {

                throw new Error(
                    "Cloudinary did not return an image URL."
                );

            }


            /* =================================================
               UPDATE STATE
            ================================================= */

            setProfile(
                previous => ({

                    ...previous,

                    profilePhotoURL:
                        uploadedURL,

                    profilePhotoPublicId:
                        publicId

                })
            );


            setLocalPhotoPreview("");


            if (temporaryURL) {

                URL.revokeObjectURL(
                    temporaryURL
                );

            }


            /* =================================================
               SAVE TO FIRESTORE
            ================================================= */

            await setDoc(

                doc(
                    db,
                    "studentProfiles",
                    user.uid
                ),

                {

                    profilePhotoURL:
                        uploadedURL,

                    profilePhotoPublicId:
                        publicId,

                    uid:
                        user.uid,

                    name:
                        user.name || "",

                    email:
                        user.email || "",

                    updatedAt:
                        new Date()

                },

                {

                    merge: true

                }

            );


            setSuccessMessage(
                "Profile photo uploaded successfully."
            );


            return uploadedURL;

        }

        catch (error) {

            console.error(
                "Profile Photo Upload Error:",
                error
            );


            setLocalPhotoPreview("");


            if (temporaryURL) {

                URL.revokeObjectURL(
                    temporaryURL
                );

            }


            setProfile(
                previous => ({

                    ...previous,

                    profilePhotoURL:
                        oldPhoto

                })
            );


            throw error;

        }

        finally {

            setPhotoUploading(false);

        }

    };


    /* =========================================================
       GALLERY PHOTO UPLOAD
    ========================================================= */

    const handlePhotoUpload = async (e) => {

        const file =
            e.target.files?.[0];


        if (!file) {

            return;

        }


        try {

            await uploadPhotoFile(
                file
            );

        }

        catch (error) {

            alert(
                error.message ||
                "Unable to upload profile photo."
            );

        }

        finally {

            e.target.value = "";

        }

    };


    /* =========================================================
       START PC / LAPTOP CAMERA
    ========================================================= */

    const openCamera = async () => {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            setCameraError(
                "Your browser does not support camera access. Please use the latest Chrome or Edge."
            );

            setShowCamera(true);

            return;

        }


        try {

            setShowCamera(true);

            setCameraLoading(true);

            setCameraError("");

            setCapturedPhoto("");


            /* =================================================
               STOP OLD CAMERA STREAM
            ================================================= */

            stopCamera();


            /* =================================================
               REQUEST CAMERA
            ================================================= */

            const stream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        facingMode: {
                            ideal: "user"
                        },

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });


            cameraStreamRef.current =
                stream;


            /* =================================================
               WAIT FOR VIDEO ELEMENT
            ================================================= */

            setTimeout(() => {

                if (videoRef.current) {

                    videoRef.current.srcObject =
                        stream;

                    videoRef.current
                        .play()
                        .catch(
                            error => {
                                console.error(
                                    "Video Play Error:",
                                    error
                                );
                            }
                        );

                }

            }, 100);

        }

        catch (error) {

            console.error(
                "Camera Error:",
                error
            );


            let message =
                "Unable to access your camera.";


            if (
                error.name ===
                "NotAllowedError"
            ) {

                message =
                    "Camera permission was denied. Please allow camera access in your browser settings and try again.";

            }

            else if (
                error.name ===
                "NotFoundError"
            ) {

                message =
                    "No camera was found on this computer.";

            }

            else if (
                error.name ===
                "NotReadableError"
            ) {

                message =
                    "Your camera is already being used by another application.";

            }

            else if (
                error.name ===
                "SecurityError"
            ) {

                message =
                    "Camera access is blocked because this page is not using HTTPS or localhost.";

            }


            setCameraError(
                message
            );

        }

        finally {

            setCameraLoading(false);

        }

    };


    /* =========================================================
       STOP CAMERA
    ========================================================= */

    const stopCamera = () => {

        if (
            cameraStreamRef.current
        ) {

            cameraStreamRef.current
                .getTracks()
                .forEach(
                    track => {
                        track.stop();
                    }
                );


            cameraStreamRef.current =
                null;

        }


        if (videoRef.current) {

            videoRef.current.srcObject =
                null;

        }

    };


    /* =========================================================
       CLOSE CAMERA
    ========================================================= */

    const closeCamera = () => {

        stopCamera();

        setShowCamera(false);

        setCameraLoading(false);

        setCameraError("");

        setCapturedPhoto("");

    };


    /* =========================================================
       CAPTURE PHOTO FROM WEBCAM
    ========================================================= */

    const capturePhoto = () => {

        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;


        if (
            !video ||
            !canvas
        ) {

            return;

        }


        if (
            !video.videoWidth ||
            !video.videoHeight
        ) {

            setCameraError(
                "Camera is not ready yet. Please wait a moment and try again."
            );

            return;

        }


        const width =
            video.videoWidth;

        const height =
            video.videoHeight;


        canvas.width =
            width;

        canvas.height =
            height;


        const context =
            canvas.getContext(
                "2d"
            );


        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );


        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.92
            );


        setCapturedPhoto(
            imageData
        );


        stopCamera();

    };


    /* =========================================================
       RETAKE PHOTO
    ========================================================= */

    const retakePhoto = async () => {

        setCapturedPhoto("");

        await openCamera();

    };


    /* =========================================================
       USE CAPTURED PHOTO
    ========================================================= */

    const useCapturedPhoto = async () => {

        if (!capturedPhoto) {

            return;

        }


        try {

            const response =
                await fetch(
                    capturedPhoto
                );


            const blob =
                await response.blob();


            const file =
                new File(
                    [
                        blob
                    ],
                    "camera-profile-photo.jpg",
                    {
                        type:
                            "image/jpeg"
                    }
                );


            closeCamera();


            await uploadPhotoFile(
                file
            );

        }

        catch (error) {

            console.error(
                "Camera Photo Upload Error:",
                error
            );


            alert(
                error.message ||
                "Unable to upload camera photo."
            );

        }

    };


    /* =========================================================
       CAMERA CLEANUP
    ========================================================= */

    useEffect(() => {

        return () => {

            stopCamera();

        };

    }, []);


    /* =========================================================
       REMOVE PROFILE PHOTO
    ========================================================= */

    const removeProfilePhoto = async () => {

        if (!user?.uid) {

            return;

        }


        const confirmed =
            window.confirm(
                "Are you sure you want to remove your profile photo?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setPhotoUploading(true);

            setSuccessMessage("");


            await setDoc(

                doc(
                    db,
                    "studentProfiles",
                    user.uid
                ),

                {

                    profilePhotoURL: "",

                    profilePhotoPublicId: "",

                    updatedAt:
                        new Date()

                },

                {

                    merge: true

                }

            );


            setProfile(
                previous => ({

                    ...previous,

                    profilePhotoURL: "",

                    profilePhotoPublicId: ""

                })
            );


            setLocalPhotoPreview("");


            setSuccessMessage(
                "Profile photo removed successfully."
            );

        }

        catch (error) {

            console.error(
                "Remove Profile Photo Error:",
                error
            );


            alert(
                error.message ||
                "Unable to remove profile photo."
            );

        }

        finally {

            setPhotoUploading(false);

        }

    };


    /* =========================================================
       OPEN PHOTO VIEWER
    ========================================================= */

    const openPhotoViewer = () => {

        if (!currentPhoto) {

            return;

        }


        setShowPhotoViewer(true);

    };


    /* =========================================================
       CLOSE PHOTO VIEWER
    ========================================================= */

    const closePhotoViewer = () => {

        setShowPhotoViewer(false);

    };


    /* =========================================================
       ESCAPE KEY
    ========================================================= */

    useEffect(() => {

        const handleEscape = (e) => {

            if (
                e.key ===
                "Escape"
            ) {

                setShowPhotoViewer(false);

                if (showCamera) {

                    closeCamera();

                }

            }

        };


        if (
            showPhotoViewer ||
            showCamera
        ) {

            document.addEventListener(
                "keydown",
                handleEscape
            );


            document.body.style.overflow =
                "hidden";

        }


        return () => {

            document.removeEventListener(
                "keydown",
                handleEscape
            );


            document.body.style.overflow =
                "";

        };

    }, [
        showPhotoViewer,
        showCamera
    ]);


    /* =========================================================
       VALIDATION
    ========================================================= */

    const validateProfile = () => {

        const tenth =
            Number(
                profile.tenthPercentage
            );


        const twelfth =
            Number(
                profile.twelfthPercentage
            );


        const cgpa =
            Number(
                profile.cgpa
            );


        const graduationYear =
            Number(
                profile.graduationYear
            );


        if (
            profile.tenthPercentage !== "" &&
            (
                tenth < 0 ||
                tenth > 100
            )
        ) {

            alert(
                "10th percentage must be between 0 and 100."
            );

            return false;

        }


        if (
            profile.twelfthPercentage !== "" &&
            (
                twelfth < 0 ||
                twelfth > 100
            )
        ) {

            alert(
                "12th percentage must be between 0 and 100."
            );

            return false;

        }


        if (
            profile.cgpa !== "" &&
            (
                cgpa < 0 ||
                cgpa > 10
            )
        ) {

            alert(
                "CGPA must be between 0 and 10."
            );

            return false;

        }


        if (
            profile.graduationYear !== "" &&
            (
                graduationYear < 2000 ||
                graduationYear > 2100
            )
        ) {

            alert(
                "Please enter a valid graduation year."
            );

            return false;

        }


        return true;

    };


    /* =========================================================
       SAVE PROFILE
    ========================================================= */

    const saveProfile = async (e) => {

        e.preventDefault();


        if (!user?.uid) {

            alert(
                "User not logged in."
            );

            return;

        }


        if (!validateProfile()) {

            return;

        }


        try {

            setLoading(true);

            setSuccessMessage("");


            await setDoc(

                doc(
                    db,
                    "studentProfiles",
                    user.uid
                ),

                {

                    ...profile,

                    name:
                        user.name || "",

                    email:
                        user.email || "",

                    uid:
                        user.uid,

                    updatedAt:
                        new Date()

                },

                {

                    merge: true

                }

            );


            setSuccessMessage(
                "Your profile has been updated successfully."
            );

        }

        catch (error) {

            console.error(
                "Save Profile Error:",
                error
            );


            alert(
                error.message ||
                "Unable to save profile."
            );

        }

        finally {

            setLoading(false);

        }

    };


    /* =========================================================
       PROFILE COMPLETION
    ========================================================= */

    const requiredProfileFields = [

        profile.phone,

        profile.collegeName,

        profile.degree,

        profile.department,

        profile.tenthPercentage,

        profile.twelfthPercentage,

        profile.cgpa,

        profile.skills,

        profile.graduationYear

    ];


    const completedFields =
        requiredProfileFields.filter(
            value =>
                String(
                    value || ""
                ).trim() !== ""
        ).length;


    const totalRequiredFields =
        requiredProfileFields.length;


    const profileCompletion =
        Math.round(
            (
                completedFields /
                totalRequiredFields
            ) * 100
        );


    /* =========================================================
       LOADING
    ========================================================= */

    if (fetching) {

        return (

            <div className="student-profile-loading">

                <div className="profile-spinner"></div>

                <p>
                    Loading your profile...
                </p>

            </div>

        );

    }


    /* =========================================================
       UI
    ========================================================= */

    return (

        <div className="student-profile">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="student-profile-header">

                <div className="header-icon">

                    <FaUserGraduate />

                </div>


                <div>

                    <span className="header-label">
                        STUDENT ACCOUNT
                    </span>


                    <h1>
                        Student Profile
                    </h1>


                    <p>
                        Keep your academic and personal
                        information updated to find jobs
                        that match your eligibility.
                    </p>

                </div>

            </div>


            {/* =================================================
                CAREER / EDUCATION VISUAL
                Pexels is decorative only.
            ================================================= */}

            <div className="student-profile-career-banner">

                <div className="career-banner-content">
                    <span className="career-banner-label">CAREER JOURNEY</span>
                    <h2>Build a stronger profile for better opportunities</h2>
                    <p>Keep your academic details and skills updated so companies can quickly understand your placement profile.</p>
                </div>

                <div className="career-banner-visual">
                    {careerImageLoading ? (
                        <div className="career-image-loading">
                            <div className="career-image-spinner"></div>
                        </div>
                    ) : careerImage ? (
                        <img src={careerImage} alt="College students preparing for their careers" />
                    ) : (
                        <div className="career-image-fallback">
                            <FaGraduationCap />
                        </div>
                    )}

                    {careerImage && (
                        <div className="career-pexels-credit">
                            Photo by <a href={careerPhotographerUrl} target="_blank" rel="noopener noreferrer">{careerPhotographer}</a> on <a href={careerPexelsUrl} target="_blank" rel="noopener noreferrer">Pexels</a>
                        </div>
                    )}
                </div>

            </div>


            {/* =================================================
                PROFILE PHOTO
            ================================================= */}

            <div className="profile-photo-card">

                <div className="profile-photo-left">


                    {/* PHOTO PREVIEW */}

                    <button
                        type="button"
                        className={
                            `profile-photo-preview ${
                                currentPhoto
                                    ? "has-photo"
                                    : "empty-photo"
                            }`
                        }
                        onClick={
                            openPhotoViewer
                        }
                        disabled={
                            !currentPhoto
                        }
                        aria-label={
                            currentPhoto
                                ? "View profile photo"
                                : "No profile photo"
                        }
                    >

                        {currentPhoto ? (

                            <>

                                <img
                                    src={
                                        currentPhoto
                                    }
                                    alt="Student profile"
                                />


                                <span className="photo-preview-overlay">

                                    <FaExpand />

                                    <span>
                                        View
                                    </span>

                                </span>

                            </>

                        ) : (

                            <>

                                <FaUserGraduate />

                                <span className="empty-photo-text">
                                    Add Photo
                                </span>

                            </>

                        )}

                    </button>


                    <div className="profile-photo-info">

                        <span className="profile-photo-label">
                            PROFILE PHOTO
                        </span>


                        <h2>
                            Your Professional Photo
                        </h2>


                        <p>
                            This photo may be visible to
                            companies and administrators when
                            they view your student information
                            or applications.
                        </p>


                        <small>
                            JPG, PNG or WebP • Maximum 5 MB
                        </small>

                    </div>

                </div>


                {/* =================================================
                    PHOTO ACTIONS
                ================================================= */}

                <div className="profile-photo-actions">


                    {/* GALLERY */}

                    <label
                        className={
                            `photo-upload-btn ${
                                photoUploading
                                    ? "is-loading"
                                    : ""
                            }`
                        }
                    >

                        {photoUploading ? (

                            <>

                                <span className="button-spinner"></span>

                                Uploading...

                            </>

                        ) : (

                            <>

                                <FaCloudUploadAlt />

                                {profile.profilePhotoURL
                                    ? "Change Photo"
                                    : "Upload Photo"
                                }

                            </>

                        )}


                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={
                                handlePhotoUpload
                            }
                            disabled={
                                photoUploading
                            }
                            hidden
                        />

                    </label>


                    {/* =================================================
                        PC CAMERA
                    ================================================= */}

                    <button
                        type="button"
                        className="camera-photo-btn"
                        onClick={
                            openCamera
                        }
                        disabled={
                            photoUploading
                        }
                    >

                        <FaCamera />

                        <span>
                            Use Camera
                        </span>

                    </button>


                    {/* REMOVE */}

                    {profile.profilePhotoURL && (

                        <button
                            type="button"
                            className="remove-photo-btn"
                            onClick={
                                removeProfilePhoto
                            }
                            disabled={
                                photoUploading
                            }
                        >

                            <FaTrash />

                            <span>
                                Remove
                            </span>

                        </button>

                    )}

                </div>

            </div>


            {/* =================================================
                PROFILE COMPLETION
            ================================================= */}

            <div className="profile-completion-card">

                <div className="completion-info">

                    <div>

                        <strong>
                            Profile Completion
                        </strong>

                        <p>
                            Complete your profile before
                            applying for placement opportunities.
                        </p>

                    </div>


                    <span>
                        {profileCompletion}%
                    </span>

                </div>


                <div className="completion-bar">

                    <div
                        className="completion-bar-fill"
                        style={{
                            width:
                                `${profileCompletion}%`
                        }}
                    ></div>

                </div>


                {profileCompletion < 100 && (

                    <small>
                        Please complete all required profile
                        information before applying for jobs.
                    </small>

                )}

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
                className="student-profile-form"
                onSubmit={
                    saveProfile
                }
            >


                {/* =================================================
                    PERSONAL INFORMATION
                ================================================= */}

                <div className="profile-section">

                    <div className="section-heading">

                        <div className="section-heading-icon">

                            <FaUserGraduate />

                        </div>


                        <div>

                            <h2>
                                Personal Information
                            </h2>

                            <p>
                                Basic information associated
                                with your account.
                            </p>

                        </div>

                    </div>


                    <div className="form-grid">


                        {/* NAME */}

                        <div className="form-group">

                            <label>
                                Full Name
                            </label>


                            <div className="input-wrapper">

                                <FaUserGraduate />

                                <input
                                    type="text"
                                    value={
                                        user?.name || ""
                                    }
                                    disabled
                                />

                            </div>


                            <small>
                                Name is managed from your account.
                            </small>

                        </div>


                        {/* EMAIL */}

                        <div className="form-group">

                            <label>
                                Email Address
                            </label>


                            <div className="input-wrapper">

                                <FaEnvelope />

                                <input
                                    type="email"
                                    value={
                                        user?.email || ""
                                    }
                                    disabled
                                />

                            </div>


                            <small>
                                Email is linked to your account.
                            </small>

                        </div>


                        {/* PHONE */}

                        <div className="form-group">

                            <label>
                                Phone Number
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaPhone />

                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    value={
                                        profile.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    maxLength="15"
                                    required
                                />

                            </div>

                        </div>


                        {/* COLLEGE */}

                        <div className="form-group">

                            <label>
                                College / University
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaUniversity />

                                <input
                                    type="text"
                                    name="collegeName"
                                    placeholder="e.g. KBC North Maharashtra University"
                                    value={
                                        profile.collegeName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <small>
                                Enter your complete college or university name.
                            </small>

                        </div>


                        {/* DEGREE */}

                        <div className="form-group">

                            <label>
                                Degree
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaGraduationCap />

                                <select
                                    name="degree"
                                    value={
                                        profile.degree
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                >

                                    <option value="">
                                        Select your degree
                                    </option>

                                    <option value="B.Tech">
                                        B.Tech
                                    </option>

                                    <option value="B.E.">
                                        B.E.
                                    </option>

                                    <option value="BCA">
                                        BCA
                                    </option>

                                    <option value="B.Sc">
                                        B.Sc
                                    </option>

                                    <option value="BBA">
                                        BBA
                                    </option>

                                    <option value="B.Com">
                                        B.Com
                                    </option>

                                    <option value="M.Tech">
                                        M.Tech
                                    </option>

                                    <option value="M.E.">
                                        M.E.
                                    </option>

                                    <option value="MCA">
                                        MCA
                                    </option>

                                    <option value="M.Sc">
                                        M.Sc
                                    </option>

                                    <option value="MBA">
                                        MBA
                                    </option>

                                    <option value="M.Com">
                                        M.Com
                                    </option>

                                    <option value="Diploma">
                                        Diploma
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>

                                </select>

                            </div>


                            <small>
                                Select the degree you are currently pursuing.
                            </small>

                        </div>


                        {/* DEPARTMENT */}

                        <div className="form-group">

                            <label>
                                Department / Branch
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaBuilding />

                                <input
                                    type="text"
                                    name="department"
                                    placeholder="e.g. Computer Engineering"
                                    value={
                                        profile.department
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <small>
                                Example: Computer Engineering, IT, Mechanical Engineering.
                            </small>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    ACADEMIC INFORMATION
                ================================================= */}

                <div className="profile-section">

                    <div className="section-heading">

                        <div className="section-heading-icon academic-icon">

                            <FaGraduationCap />

                        </div>


                        <div>

                            <h2>
                                Academic Information
                            </h2>


                            <p>
                                These details may be used to
                                determine your eligibility for
                                job applications.
                            </p>

                        </div>

                    </div>


                    <div className="academic-notice">

                        <FaCheckCircle />


                        <div>

                            <strong>
                                Keep your academic details accurate
                            </strong>


                            <p>
                                Companies may specify minimum
                                10th, 12th and CGPA requirements
                                for their jobs.
                            </p>

                        </div>

                    </div>


                    <div className="form-grid">


                        {/* 10TH */}

                        <div className="form-group">

                            <label>
                                10th Percentage
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaChartLine />

                                <input
                                    type="number"
                                    name="tenthPercentage"
                                    placeholder="e.g. 85"
                                    value={
                                        profile.tenthPercentage
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    required
                                />

                                <em>
                                    %
                                </em>

                            </div>


                            <small>
                                Enter percentage between 0 and 100.
                            </small>

                        </div>


                        {/* 12TH */}

                        <div className="form-group">

                            <label>
                                12th Percentage
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaChartLine />

                                <input
                                    type="number"
                                    name="twelfthPercentage"
                                    placeholder="e.g. 82"
                                    value={
                                        profile.twelfthPercentage
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    required
                                />

                                <em>
                                    %
                                </em>

                            </div>


                            <small>
                                Enter percentage between 0 and 100.
                            </small>

                        </div>


                        {/* CGPA */}

                        <div className="form-group">

                            <label>
                                CGPA
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaChartLine />

                                <input
                                    type="number"
                                    name="cgpa"
                                    placeholder="e.g. 8.14"
                                    value={
                                        profile.cgpa
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    required
                                />

                                <em>
                                    / 10
                                </em>

                            </div>


                            <small>
                                Enter CGPA on a 10-point scale.
                            </small>

                        </div>


                        {/* GRADUATION YEAR */}

                        <div className="form-group">

                            <label>
                                Graduation Year
                                <span>*</span>
                            </label>


                            <div className="input-wrapper">

                                <FaCalendarAlt />

                                <input
                                    type="number"
                                    name="graduationYear"
                                    placeholder="e.g. 2027"
                                    value={
                                        profile.graduationYear
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    min="2000"
                                    max="2100"
                                    required
                                />

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    SKILLS
                ================================================= */}

                <div className="profile-section">

                    <div className="section-heading">

                        <div className="section-heading-icon skills-icon">

                            <FaCode />

                        </div>


                        <div>

                            <h2>
                                Skills & Expertise
                            </h2>


                            <p>
                                Add the technical and professional
                                skills that you want companies to see.
                            </p>

                        </div>

                    </div>


                    <div className="form-group full-width">

                        <label>
                            Skills
                            <span>*</span>
                        </label>


                        <div className="textarea-wrapper">

                            <FaCode />


                            <textarea
                                name="skills"
                                placeholder="Example: Java, JavaScript, React, Node.js, Python, SQL..."
                                value={
                                    profile.skills
                                }
                                onChange={
                                    handleChange
                                }
                                rows="5"
                                required
                            />

                        </div>


                        <small>
                            Separate multiple skills with commas.
                        </small>

                    </div>

                </div>


                {/* =================================================
                    SAVE AREA
                ================================================= */}

                <div className="profile-save-area">

                    <div className="save-message">

                        {successMessage && (

                            <>

                                <FaCheckCircle />

                                <span>
                                    {successMessage}
                                </span>

                            </>

                        )}

                    </div>


                    <button
                        type="submit"
                        className="save-profile-btn"
                        disabled={
                            loading ||
                            photoUploading
                        }
                    >

                        {loading ? (

                            <>

                                <span className="button-spinner"></span>

                                Saving Profile...

                            </>

                        ) : (

                            <>

                                <FaSave />

                                Save Profile

                            </>

                        )}

                    </button>

                </div>

            </form>


            {/* =====================================================
                CAMERA MODAL
            ===================================================== */}

            {showCamera && (

                <div
                    className="camera-modal-overlay"
                    onMouseDown={(e) => {

                        if (
                            e.target ===
                            e.currentTarget
                        ) {

                            closeCamera();

                        }

                    }}
                >

                    <div className="camera-modal">


                        {/* CAMERA HEADER */}

                        <div className="camera-modal-header">

                            <div>

                                <span>
                                    PROFILE PHOTO
                                </span>

                                <h2>
                                    Take Photo
                                </h2>

                                <p>
                                    Position your face inside the camera frame.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="camera-close-btn"
                                onClick={
                                    closeCamera
                                }
                            >

                                <FaTimes />

                            </button>

                        </div>


                        {/* CAMERA CONTENT */}

                        <div className="camera-content">

                            {!capturedPhoto ? (

                                <>

                                    {cameraLoading && (

                                        <div className="camera-loading">

                                            <div className="camera-spinner"></div>

                                            <strong>
                                                Starting camera...
                                            </strong>

                                            <span>
                                                Please allow camera permission if your browser asks.
                                            </span>

                                        </div>

                                    )}


                                    {!cameraError && (

                                        <video
                                            ref={videoRef}
                                            className="camera-video"
                                            autoPlay
                                            playsInline
                                            muted
                                        />

                                    )}


                                    {cameraError && (

                                        <div className="camera-error">

                                            <div className="camera-error-icon">

                                                <FaCamera />

                                            </div>


                                            <h3>
                                                Camera unavailable
                                            </h3>


                                            <p>
                                                {cameraError}
                                            </p>


                                            <button
                                                type="button"
                                                className="camera-retry-btn"
                                                onClick={
                                                    openCamera
                                                }
                                            >

                                                <FaSyncAlt />

                                                Try Again

                                            </button>

                                        </div>

                                    )}

                                </>

                            ) : (

                                <div className="captured-photo-preview">

                                    <img
                                        src={
                                            capturedPhoto
                                        }
                                        alt="Captured profile"
                                    />

                                </div>

                            )}


                            <canvas
                                ref={canvasRef}
                                hidden
                            />

                        </div>


                        {/* CAMERA FOOTER */}

                        <div className="camera-modal-footer">

                            {!capturedPhoto ? (

                                <>

                                    <button
                                        type="button"
                                        className="camera-cancel-btn"
                                        onClick={
                                            closeCamera
                                        }
                                    >

                                        Cancel

                                    </button>


                                    <button
                                        type="button"
                                        className="capture-photo-btn"
                                        onClick={
                                            capturePhoto
                                        }
                                        disabled={
                                            cameraLoading ||
                                            !!cameraError
                                        }
                                    >

                                        <FaCamera />

                                        Take Photo

                                    </button>

                                </>

                            ) : (

                                <>

                                    <button
                                        type="button"
                                        className="camera-cancel-btn"
                                        onClick={
                                            retakePhoto
                                        }
                                    >

                                        <FaSyncAlt />

                                        Retake

                                    </button>


                                    <button
                                        type="button"
                                        className="use-photo-btn"
                                        onClick={
                                            useCapturedPhoto
                                        }
                                        disabled={
                                            photoUploading
                                        }
                                    >

                                        {photoUploading ? (

                                            <>

                                                <span className="button-spinner"></span>

                                                Uploading...

                                            </>

                                        ) : (

                                            <>

                                                <FaCheckCircle />

                                                Use This Photo

                                            </>

                                        )}

                                    </button>

                                </>

                            )}

                        </div>

                    </div>

                </div>

            )}


            {/* =====================================================
                PROFESSIONAL PHOTO VIEWER
            ===================================================== */}

            {showPhotoViewer && currentPhoto && (

                <div
                    className="photo-viewer-overlay"
                    onMouseDown={
                        (e) => {

                            if (
                                e.target ===
                                e.currentTarget
                            ) {

                                closePhotoViewer();

                            }

                        }
                    }
                >

                    <div className="photo-viewer-container">


                        {/* TOP BAR */}

                        <div className="photo-viewer-header">

                            <div>

                                <span>
                                    PROFILE PHOTO
                                </span>

                                <strong>
                                    Student Profile
                                </strong>

                            </div>


                            <button
                                type="button"
                                className="photo-viewer-close"
                                onClick={
                                    closePhotoViewer
                                }
                                aria-label="Close photo viewer"
                            >

                                <FaTimes />

                            </button>

                        </div>


                        {/* IMAGE */}

                        <div className="photo-viewer-image-area">

                            <img
                                src={
                                    currentPhoto
                                }
                                alt="Student profile enlarged"
                            />

                        </div>


                        {/* FOOTER */}

                        <div className="photo-viewer-footer">

                            <div className="viewer-photo-info">

                                <div className="viewer-photo-icon">

                                    <FaEye />

                                </div>


                                <div>

                                    <strong>
                                        Profile Photo
                                    </strong>

                                    <span>
                                        Visible to companies and administrators
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                className="viewer-done-btn"
                                onClick={
                                    closePhotoViewer
                                }
                            >

                                Close

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}


export default StudentProfile;