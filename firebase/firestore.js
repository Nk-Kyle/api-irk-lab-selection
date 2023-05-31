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
} = require("firebase/firestore");
const db = getFirestore(firebaseApp);

const userCollection = collection(db, "users");
const assistantCollection = collection(db, "assistants");
const { GUEST, STUDENT, ASSISTANT } = require("../constants/constants");

const getOrCreateUser = async (user, isStudent) => {
    const q = query(userCollection, where("email", "==", user.email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        if (!isStudent) {
            user["role"] = GUEST;
            console.log(GUEST);
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

const getAssistant = async () => {
    const assistantsSnapshot = await getDocs(assistantCollection);
    const assistants = [];
    assistantsSnapshot.forEach((doc) => {
        assistants.push(doc.data().email);
    });
    return assistants;
};

const getUsers = async () => {
    const usersSnapshot = await getDocs(userCollection);
    const users = [];
    usersSnapshot.forEach((doc) => {
        users.push(doc.data());
    });
};

const createUser = async (user) => {
    const newUserRef = await addDoc(userCollection, user);
    const newUserSnapshot = await getDoc(newUserRef);
    return newUserSnapshot.data();
};

const queryUserByName = async (name) => {
    const q = query(userCollection, where("name", "==", name));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
        users.push(doc.data());
    });
    return users;
};

module.exports = {
    getUsers,
    getOrCreateUser,
    createUser,
    queryUserByName,
};
