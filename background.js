import{d as p}from"./assets/database-Ckwkmqwe.js";

console.log("[Promptologist] Background service worker initialized");

chrome.runtime.onInstalled.addListener(async()=>{
  console.log("[Promptologist] Extension installed/updated");
  await updateContextMenu();
});

chrome.storage.onChanged.addListener(async(changes, areaName)=>{
  if(areaName==="local")await updateContextMenu();
});

// MESSAGE VALIDATION - FIX #4
chrome.runtime.onMessage.addListener((message, sender, sendResponse)=>{
  // Verify sender is from this extension
  if(sender.id !== chrome.runtime.id){
    console.error("[Security] Invalid sender ID - rejecting message");
    return false;
  }
  
  // Validate message structure
  if(!message || typeof message.type !== 'string'){
    console.error("[Security] Invalid message structure");
    return false;
  }
  
  // Whitelist allowed message types
  const ALLOWED_MESSAGE_TYPES = ['UPDATE_CONTEXT_MENU', 'GET_SELECTED_TEXT'];
  if(!ALLOWED_MESSAGE_TYPES.includes(message.type)){
    console.error("[Security] Unauthorized message type:", message.type);
    return false;
  }
  
  if(message.type==="UPDATE_CONTEXT_MENU"){
    return updateContextMenu().then(()=>{
      sendResponse({success:!0});
    }),!0;
  }
  
  if(message.type==="GET_SELECTED_TEXT"){
    return chrome.tabs.query({active:!0,currentWindow:!0},async n=>{
      if(n[0]?.id)try{
        const e=await chrome.scripting.executeScript({target:{tabId:n[0].id},func:()=>window.getSelection()?.toString()||""});
        sendResponse({text:e[0]?.result||""});
      }catch{
        sendResponse({text:""});
      }
    }),!0;
  }
});

async function updateContextMenu(){
  await chrome.contextMenus.removeAll();
  try{
    const prompts=await p.prompts.orderBy("category").toArray();
    const categories=await p.categories.toArray();
    
    if(prompts.length===0){
      chrome.contextMenus.create({id:"no-prompts",title:"No prompts yet - Create one!",contexts:["selection","page"]});
      return;
    }
    
    const grouped={};
    prompts.forEach(e=>{
      const a=e.category||"General";
      grouped[a]||(grouped[a]=[]);
      grouped[a].push(e);
    });
    
    chrome.contextMenus.create({id:"promptologist-root",title:"Promptologist",contexts:["selection","page"]});
    
    const favorites=prompts.filter(e=>e.isFavorite);
    if(favorites.length>0){
      chrome.contextMenus.create({id:"favorites-separator",title:"⭐ Favorites",contexts:["selection","page"],parentId:"promptologist-root",enabled:!1});
      favorites.forEach(e=>{
        chrome.contextMenus.create({id:`prompt-${e.id}`,title:`⭐ ${e.name}`,contexts:["selection","page"],parentId:"promptologist-root"});
      });
      chrome.contextMenus.create({id:"separator-after-favorites",type:"separator",contexts:["selection","page"],parentId:"promptologist-root"});
    }
    
    Object.entries(grouped).forEach(([categoryName,catPrompts])=>{
      if(catPrompts.length===0)return;
      const categoryId=`category-${categoryName}`;
      chrome.contextMenus.create({id:categoryId,title:`📁 ${categoryName}`,contexts:["selection","page"],parentId:"promptologist-root"});
      catPrompts.filter(r=>!r.isFavorite).forEach(r=>{
        chrome.contextMenus.create({id:`prompt-${r.id}`,title:r.name,contexts:["selection","page"],parentId:categoryId});
      });
    });
    
    console.log("[Promptologist] Context menu updated with",prompts.length,"prompts");
  }catch(error){
    console.error("[Promptologist] Error updating context menu:",error);
  }
}

// RETRY LOGIC - FIX #6
async function executePromptWithRetry(tabId,prompt,platform,maxRetries=5){
  const INITIAL_DELAY_MS=500;
  let lastError;
  
  for(let attempt=0;attempt<maxRetries;attempt++){
    try{
      const messageId=`msg_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
      const response=await chrome.tabs.sendMessage(tabId,{
        type:"EXECUTE_PROMPT",
        prompt:prompt,
        platform:platform,
        messageId:messageId,
        timestamp:Date.now(),
        attempt:attempt+1
      });
      
      if(response&&response.success===true){
        console.log(`[Promptologist] Prompt executed on attempt ${attempt+1}`);
        return true;
      }
      throw new Error(`Invalid response: ${JSON.stringify(response)}`);
    }catch(error){
      lastError=error;
      if(attempt>=maxRetries-1)break;
      
      const delayMs=INITIAL_DELAY_MS*Math.pow(2,attempt);
      console.log(`[Promptologist] Retry attempt ${attempt+2}/${maxRetries} in ${delayMs}ms...`);
      await new Promise(resolve=>setTimeout(resolve,delayMs));
    }
  }
  
  console.error(`[Promptologist] Failed after ${maxRetries} attempts`);
  throw lastError||new Error("Execution failed after retries");
}

chrome.contextMenus.onClicked.addListener(async(info,tab)=>{
  if(!tab?.id)return;
  const promptId=info.menuItemId.toString().replace("prompt-","");
  
  if(promptId==="no-prompts"){
    chrome.action.openPopup();
    return;
  }
  
  try{
    const prompt=await p.prompts.get(promptId);
    if(!prompt){
      console.error("[Promptologist] Prompt not found:",promptId);
      return;
    }
    
    let content=prompt.content;
    content=content.replace(/\{\{text\}\}/g,info.selectionText||"");
    content=content.replace(/\{\{url\}\}/g,tab.url||"");
    content=content.replace(/\{\{title\}\}/g,tab.title||"");
    
    const platforms=[
      {name:"ChatGPT",url:"https://chat.openai.com",pattern:/chat\.openai\.com/},
      {name:"Claude",url:"https://claude.ai",pattern:/claude\.ai/},
      {name:"Gemini",url:"https://gemini.google.com",pattern:/gemini\.google\.com/},
      {name:"Perplexity",url:"https://www.perplexity.ai",pattern:/perplexity\.ai/},
      {name:"POE",url:"https://poe.com",pattern:/poe\.com/},
      {name:"Grok",url:"https://grok.x.ai",pattern:/grok\.x\.ai/}
    ];
    
    const detectedPlatform=platforms.find(s=>s.pattern.test(tab.url||""));
    
    if(detectedPlatform){
      // Already on AI platform
      await executePromptWithRetry(tab.id,content,detectedPlatform.name);
    }else{
      // Open ChatGPT in new tab
      const newTab=await chrome.tabs.create({url:"https://chat.openai.com"});
      
      // Wait for tab to load
      await new Promise((resolve)=>{
        const listener=(tabId,changeInfo)=>{
          if(tabId===newTab.id&&changeInfo.status==="complete"){
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);
      });
      
      // Execute with retry
      await executePromptWithRetry(newTab.id,content,"ChatGPT");
    }
    
    // Increment usage count
    await p.prompts.update(promptId,{usageCount:(prompt.usageCount||0)+1});
  }catch(error){
    console.error("[Promptologist] Error executing prompt:",error);
    alert(`Error: ${error.message}`);
  }
});

// Rebuild menu on startup and when storage changes
setInterval(()=>{updateContextMenu();},30000);
