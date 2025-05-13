// hooks/usePermissions.js
import { useEffect, useState } from 'react';
import {decryptSessionData} from './StorageUtils'
function usePermissions() {
  const [permissions, setPermissions] = useState([]);
 

  useEffect(() => {

    const encryptedData = sessionStorage.getItem('userData');
   
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      
      console.log("Decrypted data in usePermissions:", decryptedData);
      
    //   console.log(decryptedData.Permissions);
      setPermissions(decryptedData.Permissions);
      // setLogin(decryptedData.login);
    }
 
  }, []);

  return permissions;
}

export default usePermissions;