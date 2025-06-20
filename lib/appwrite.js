import { Account, Client, Databases, Storage } from 'react-native-appwrite';


export const appwriteConfig = {
    endpoint : 'https://cloud.appwrite.io/v1',
    platform : 'com.iieo.arqr',
    projectId: '6763fe500006de594234',
    databaseId : '676400030013c65fde49',
    userCollectionId : '67640022000a7cd3a657',
    productCollectionId : '676400490003acf4906a',
    storageId : '676400af001599994721'
}

// Initialize the Appwrite client
const client = new Client();
client
  .setEndpoint(appwriteConfig.endpoint) 
  .setProject(appwriteConfig.projectId) 
  .setPlatform(appwriteConfig.platform); 

// Initialize the Appwrite services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

