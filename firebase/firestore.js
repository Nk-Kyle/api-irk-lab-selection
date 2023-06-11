const firebaseApp = require("./firebase");
const {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    getDoc,
    query,
    where,
    updateDoc,
    doc,
    limit,
    orderBy,
    setDoc,
} = require("firebase/firestore");
const db = getFirestore(firebaseApp);

const userCollection = collection(db, "users");
const assistantCollection = collection(db, "assistants");
const taskCollection = collection(db, "tasks");
const { GUEST, STUDENT, ASSISTANT } = require("../constants/constants");

const getOrCreateUser = async (user, isStudent) => {
    // Limit the query to 1 document in case there are multiple documents with the same email
    const q = query(userCollection, where("email", "==", user.email), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        if (!isStudent) {
            user["role"] = GUEST;
        } else {
            await getAssistant().then((assistants) => {
                if (assistants.includes(user.email)) {
                    user["role"] = ASSISTANT;
                } else {
                    user["role"] = STUDENT;
                }
            });
        }
        const newUser = await createUser({
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user["role"],
        });
        if (newUser.role === ASSISTANT) {
            const assistantDoc = await getDoc(
                doc(assistantCollection, user.email),
            );
            let assistant = assistantDoc.data();
            assistant["picture"] = user.picture;
            updateDoc(doc(assistantCollection, user.email), assistant);
        }
        return newUser;
    } else {
        const existingUser = querySnapshot.docs[0];
        const userRef = doc(db, "users", existingUser.id);
        await updateDoc(userRef, {
            name: user.name,
            picture: user.picture,
        });
        const updatedUserSnapshot = await getDoc(userRef);
        if (existingUser.data().role === ASSISTANT) {
            const assistantDoc = await getDoc(
                doc(assistantCollection, user.email),
            );
            let assistant = assistantDoc.data();
            assistant["picture"] = user.picture;
            updateDoc(doc(assistantCollection, user.email), assistant);
        }
        return updatedUserSnapshot.data();
    }
};

const getAssistantTask = async (assistantEmail) => {
    const q = query(
        taskCollection,
        where("assistant", "==", assistantEmail),
        limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    } else {
        return querySnapshot.docs[0].data();
    }
};

const createOrUpdateTask = async (user, task) => {
    task = {
        title: task.title,
        description: task.description,
        imageUrl: task.imageUrl,
        startDate: new Date(task.startDate).getTime(),
        assistant: user.email,
        link: task.link,
        score: parseInt(task.score),
        assistant_picture: user.picture,
        assistant_name: user.name,
    };
    const q = query(
        taskCollection,
        where("assistant", "==", user.email),
        limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        const newTaskRef = await addDoc(taskCollection, task);
        const newTaskSnapshot = await getDoc(newTaskRef);
        return newTaskSnapshot.data();
    } else {
        const existingTask = querySnapshot.docs[0];
        const taskRef = doc(db, "tasks", existingTask.id);
        await updateDoc(taskRef, task);
        const updatedTaskSnapshot = await getDoc(taskRef);
        return updatedTaskSnapshot.data();
    }
};

const getAssistant = async () => {
    const assistantsSnapshot = await getDocs(assistantCollection);
    const assistants = [];
    assistantsSnapshot.forEach((doc) => {
        assistants.push(doc.data().email);
    });
    return assistants;
};

const createUser = async (user) => {
    const newUserRef = await addDoc(userCollection, user);
    const newUserSnapshot = await getDoc(newUserRef);
    return newUserSnapshot.data();
};

const getTasks = async () => {
    const tasksPromise = getDocs(
        query(
            taskCollection,
            where("startDate", "<=", new Date().getTime()),
            orderBy("startDate", "asc"),
        ),
    );

    const settingPromise = await getSetting();

    const [tasksSnapshot, setting] = await Promise.all([
        tasksPromise,
        settingPromise,
    ]);

    const tasks = [];
    for (const doc of tasksSnapshot.docs) {
        const task = doc.data();
        const submissionsSnapshot = await getDocs(
            collection(doc.ref, "submissions"),
        );
        task.submissionCount = submissionsSnapshot.size;
        task.id = doc.id;
        tasks.push(task);
    }

    return {
        tasks: tasks,
        setting: setting,
    };
};

const getTask = async (user, taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
        return null;
    }
    const task = taskSnapshot.data();
    const submissionsSnapshot = await getDocs(
        collection(taskRef, "submissions"),
    );
    task.submissionCount = submissionsSnapshot.size;

    // Check if the user has submitted a solution
    const submissionRef = doc(taskRef, "submissions", user.email);
    const submissionSnapshot = await getDoc(submissionRef);
    if (submissionSnapshot.exists()) {
        task.submitted = true;
        task.submission = submissionSnapshot.data();
    } else {
        task.submitted = false;
    }
    return task;
};

const getTaskSubmissions = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
        return null;
    }
    const submissionsSnapshot = await getDocs(
        query(collection(taskRef, "submissions"), orderBy("updated_at", "asc")),
    );
    const submissions = [];
    submissionsSnapshot.forEach((doc) => {
        submissions.push(doc.data());
    });
    return submissions;
};

const getTaskSubmissionsForAssistant = async (user) => {
    const q = query(
        taskCollection,
        where("assistant", "==", user.email),
        limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return [];
    } else {
        const task = querySnapshot.docs[0];
        const submissionsSnapshot = await getDocs(
            query(
                collection(task.ref, "submissions"),
                orderBy("updated_at", "asc"),
            ),
        );
        const submissions = [];
        submissionsSnapshot.forEach((doc) => {
            submissions.push(doc.data());
        });
        return submissions;
    }
};

const createOrUpdateSubmission = async (user, taskId, link) => {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnapshot = await getDoc(taskRef);
    if (!taskSnapshot.exists()) {
        return null;
    }
    // Check if the user has submitted a solution
    const submissionRef = doc(taskRef, "submissions", user.email);
    const submissionSnapshot = await getDoc(submissionRef);
    if (submissionSnapshot.exists()) {
        // Update the submission
        const submission = submissionSnapshot.data();
        if (submission.scored === true) {
            return false;
        }

        submission.link = link;
        submission.updated_at = new Date().getTime();

        await updateDoc(submissionRef, submission);
        return [true, taskSnapshot.data().assistant, false];
    } else {
        // Create a new submission
        await setDoc(submissionRef, {
            link: link,
            scored: false,
            student_picture: user.picture,
            student_name: user.name,
            student_email: user.email,
            score: 0,
            updated_at: new Date().getTime(),
        });
        return [true, taskSnapshot.data().assistant, true];
    }
};

const scoreSubmission = async (user, submissionId, score) => {
    const q = query(
        taskCollection,
        where("assistant", "==", user.email),
        limit(1),
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const task = querySnapshot.docs[0];
    if (task.data().assistant !== user.email) {
        return null;
    }
    const taskRef = doc(db, "tasks", task.id);
    const submissionRef = doc(taskRef, "submissions", submissionId);
    const submissionSnapshot = await getDoc(submissionRef);
    if (!submissionSnapshot.exists()) {
        return null;
    }
    const submission = submissionSnapshot.data();
    submission.score = parseInt(score);
    submission.scored = true;
    await updateDoc(submissionRef, submission);
    return true;
};

const getScores = async () => {
    // Get all tasks
    const tasksSnapshot = await getDocs(
        query(
            taskCollection,
            where("startDate", "<=", new Date().getTime()),
            orderBy("startDate", "asc"),
        ),
    );
    const tasks = [];

    await Promise.all(
        tasksSnapshot.docs.map(async (doc) => {
            // For each task, get all submissions
            const submissionCollection = collection(doc.ref, "submissions");
            const submissionsSnapshot = await getDocs(submissionCollection);
            const submissions = [];

            submissionsSnapshot.forEach((doc) => {
                const submission = doc.data();
                if (submission.scored) {
                    submissions.push({
                        student_name: submission.student_name,
                        student_email: submission.student_email,
                        score: submission.score,
                    });
                }
            });

            tasks.push({
                id: doc.id,
                title: doc.data().title,
                submissions: submissions,
            });
        }),
    );

    return tasks;
};

const getContacts = async () => {
    const assistantsSnapshot = await getDocs(assistantCollection);
    const assistants = [];
    assistantsSnapshot.forEach((doc) => {
        assistants.push(doc.data());
    });
    return assistants;
};

const getSetting = async () => {
    const settingSnapshot = await getDoc(doc(db, "setting", "default"));
    if (!settingSnapshot.exists()) {
        return null;
    }
    return settingSnapshot.data();
};

const registerLine = async (assistantEmail, lineId) => {
    const assistantRef = doc(db, "assistants", assistantEmail);
    const assistantSnapshot = await getDoc(assistantRef);
    if (!assistantSnapshot.exists()) {
        return false;
    }
    const assistant = assistantSnapshot.data();
    assistant.linehook = lineId;
    await updateDoc(assistantRef, assistant);
    return true;
};

const getAssistantByEmail = async (email) => {
    const assistantRef = doc(db, "assistants", email);
    const assistantSnapshot = await getDoc(assistantRef);
    if (!assistantSnapshot.exists()) {
        return null;
    }
    return assistantSnapshot.data();
};

module.exports = {
    getOrCreateUser,
    getAssistantTask,
    getAssistantByEmail,
    createUser,
    createOrUpdateTask,
    getTasks,
    getTask,
    createOrUpdateSubmission,
    getTaskSubmissions,
    getTaskSubmissionsForAssistant,
    scoreSubmission,
    getScores,
    getContacts,
    registerLine,
};
