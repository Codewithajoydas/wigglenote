export async function getVersion(){
    return await window.dbAPI.getAppVersion()
}