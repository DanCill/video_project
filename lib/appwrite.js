import { Account, Avatars, Client, Databases, ID, Query } from 'react-native-appwrite';

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.djc.aora',
    projectId: '669a16d1002f02e8c043',
    databaseId: '669a1826002730a752d4',
    userCollectionId: '669a1841001a27dc274d',
    videoCollectionId: '669a185d00184d834174',
    storageId: '669a1993000b747365ea'
}

const {
    endpoint,
    projectId,
    databaseId,
    userCollectionId,
    videoCollectionId,
    storageId,
    platform,
} = appwriteConfig;

const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint) 
    .setProject(appwriteConfig.projectId) 
    .setPlatform(appwriteConfig.platform) 
;

const account = new Account(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username,
        )
        console.log(newAccount)
        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username)

        await signIn(email, password)

        const newUser = await databases.createDocument(
            databaseId, 
            userCollectionId, 
            ID.unique(), 
            {
            accountId: newAccount.$id,
            email,
            username,
            avatar: avatarUrl
        })
        return newUser;
    } catch (error) {
        console.log(error);
        throw new Error(`Failed to create user ${error}`);
    }
}

export const signIn = async (email, password) => {
    try {
        const session = await account.createEmailPasswordSession(email, password)

        return session
    } catch (error) {
        console.log(error);
        throw new Error(`Failed to sign in ${error}`);
    }
}

export const getCurrentUser = async () => {

  try {
    const currentAccount = await account.get()

    if(!currentAccount) throw Error;
    const currentUser = await databases.listDocuments(
        databaseId,
        userCollectionId,
        [Query.equal('accountId', currentAccount.$id)]
    )

    if(!currentUser) throw Error;

    return currentUser.documents[0]
  } catch (error) {
    console.log(error);
  }

}

export const getAllPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId
        )
        return posts.documents
    } catch (error) {
        throw new Error(`Failed to get all posts ${error}`);
    }
}

export const getLatestPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.orderDesc('$createdAt', Query.limit(7))]
        )
        return posts.documents
    } catch (error) {
        throw new Error(`Failed to get all posts ${error}`);
    }
}

