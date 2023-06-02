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
        return newUser;
    } else {
        const existingUser = querySnapshot.docs[0];
        const userRef = doc(db, "users", existingUser.id);
        await updateDoc(userRef, {
            name: user.name,
            picture: user.picture,
        });
        const updatedUserSnapshot = await getDoc(userRef);
        return updatedUserSnapshot.data();
    }
};

const getAssistantTask = async (assistantEmail) => {
    const q = query(
        taskCollection,
        where("assistant", "==", assistantEmail),
        limit(1)
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
        limit(1)
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
    const tasksSnapshot = await getDocs(
        query(
            taskCollection,
            where("startDate", "<=", new Date().getTime()),
            orderBy("startDate", "asc")
        )
    );

    const tasks = [];
    for (const doc of tasksSnapshot.docs) {
        const task = doc.data();
        const submissionsSnapshot = await getDocs(
            collection(doc.ref, "submissions")
        );
        task.submissionCount = submissionsSnapshot.size;
        task.id = doc.id;
        tasks.push(task);
    }
    return tasks;
};

module.exports = {
    getOrCreateUser,
    getAssistantTask,
    createUser,
    createOrUpdateTask,
    getTasks,
};
