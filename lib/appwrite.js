import { Account, Avatars, Client, Databases, Storage, ID, Query } from 'react-native-appwrite';

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
const storage = new Storage(client);

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

export const getAccount = async () => {
    try {
        const currentAccount = await account.get();
    
        return currentAccount;
      } catch (error) {
        throw new Error(error);
      }
}

export const getCurrentUser = async () => {

  try {
    const currentAccount = await getAccount();

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
            videoCollectionId,
            [Query.orderDesc('$createdAt')]
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

export const searchPosts = async (query) => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.search('title', query)]
        )
        return posts.documents
    } catch (error) {
        throw new Error(`Failed to get all posts ${error}`);
    }
}

export const getUserPosts = async (userId) => {
    try {
        const posts = await databases.listDocuments(
            databaseId,
            videoCollectionId,
            [Query.equal('creator', userId), Query.orderDesc('$createdAt')]
        )
        return posts.documents
    } catch (error) {
        throw new Error(`Failed to get all posts ${error}`);
    }
}

export const signOut = async () => {
    try {
        const session = await account.deleteSession('current');
        return session;
    } catch (error) {
        throw new Error(`Failed to sign out ${error}`);
    }
}

export const getFilePreview = async (fileId, type) => {
    let fileUrl;

    try {
        if(type === 'video') {
            fileUrl = storage.getFileView(storageId, fileId)
        } else if(type === 'image') {
            fileUrl = storage.getFilePreview(storageId, fileId, 2000, 2000, 'top', 100)
        } else {
            throw new Error(`Invalid type ${type}`);
        }

        if(!fileUrl) throw new Error(`Failed to get preview ${fileId}`);

        return fileUrl;
    } catch (error) {
        throw new Error(`Failed to get preview ${error}`);
    }
}

export const uploadFile = async (file, type) => {
    if(!file) return;
    const {mimeType, ...rest} = file;
    const asset = {
        name: file.fileName,
        type: file.mimeType,
        size: file.fileSize,
        uri: file.uri
    };

    try {
        const uploadedFile = await storage.createFile(
            storageId,
            ID.unique(),
            asset
        );
        const fileUrl = await getFilePreview(uploadedFile.$id, type);
        return fileUrl;
    } catch (error) {
        throw new Error(`Failed to upload file ${error}`);
    }
}

export const createVideo = async (form) => {
    try {
        const [thumbnailUrl, videoUrl] = await Promise.all([
            uploadFile(form.thumbnail, 'image'),
            uploadFile(form.video, 'video')
        ])

        const newPost = await databases.createDocument(
            databaseId,
            videoCollectionId,
            ID.unique(), 
            {
            title: form.title,
            thumbnail: thumbnailUrl,
            video: videoUrl,
            prompt: form.prompt,
            creator: form.userId,
            }
        )
        return newPost;
    } catch (error) {
        throw new Error(`Failed to create video ${error}`);
    }
}
