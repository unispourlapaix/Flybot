function readPreference(key,fallback){
  try{var value=window.localStorage.getItem('flybot-'+key);return value===null?fallback:JSON.parse(value);}catch(error){return fallback;}
}
function savePreference(key,value){try{window.localStorage.setItem('flybot-'+key,JSON.stringify(value));}catch(error){}}
