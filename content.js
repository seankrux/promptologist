var d=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports);var p=d((y,r)=>{

console.log("[Sean Promptology] Content script loaded");

// INPUT SANITIZATION - FIX #5
function validateAndSanitizePrompt(prompt){
  if(typeof prompt !== 'string'){
    throw new Error("Prompt must be a string");
  }
  
  if(prompt.length > 50000){
    throw new Error("Prompt exceeds maximum length (50000 characters)");
  }
  
  const DANGEROUS_PATTERNS=[
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i,
    /function\s*\(/i,
    /constructor\s*\(/i
  ];
  
  for(const pattern of DANGEROUS_PATTERNS){
    if(pattern.test(prompt)){
      throw new Error("Prompt contains potentially dangerous content");
    }
  }
  
  return prompt;
}

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(message.type==="EXECUTE_PROMPT"){
    console.log("[Sean Promptology] Executing prompt:",message.prompt.substring(0,50)+"...");
    try{
      executePrompt(message.prompt,message.platform);
      sendResponse({success:true});
    }catch(error){
      console.error("[Sean Promptology] Execution error:",error);
      sendResponse({success:false,error:error.message});
    }
  }
  return true;
});

async function executePrompt(promptText,platform){
  console.log(`[Sean Promptology] Platform: ${platform}`);
  
  // VALIDATE PROMPT FIRST
  try{
    validateAndSanitizePrompt(promptText);
  }catch(error){
    console.error("[Security] Invalid prompt:",error.message);
    alert(`Security Error: ${error.message}`);
    throw error;
  }
  
  await waitForElement(getSelector(platform));
  await delay(500);
  
  const textarea=document.querySelector(getSelector(platform));
  if(!textarea){
    console.error("[Sean Promptology] Textarea not found");
    alert("Could not find input field. Make sure you're on the correct page.");
    throw new Error("Textarea not found");
  }
  
  // Use .value for safety instead of .textContent
  textarea.value=promptText;
  textarea.dispatchEvent(new Event("input",{bubbles:true}));
  textarea.dispatchEvent(new Event("change",{bubbles:true}));
  textarea.focus();
  
  await delay(300);
  
  const submitButton=findSubmitButton(platform);
  if(submitButton){
    console.log("[Sean Promptology] Clicking submit button");
    submitButton.click();
  }else{
    console.warn("[Sean Promptology] Submit button not found, prompt inserted but not submitted");
    textarea.dispatchEvent(new KeyboardEvent("keydown",{
      key:"Enter",
      code:"Enter",
      keyCode:13,
      bubbles:true
    }));
  }
}

function getSelector(platform){
  return{
    ChatGPT:'#prompt-textarea, textarea[placeholder*="Message"]',
    Claude:'div[contenteditable="true"][role="textbox"], textarea',
    Gemini:'div[contenteditable="true"], textarea',
    Perplexity:'textarea, div[contenteditable="true"]'
  }[platform]||'textarea, div[contenteditable="true"]';
}

function findSubmitButton(platform){
  const selectors=[
    'button[data-testid="send-button"]',
    'button[aria-label*="Send"]',
    'button[aria-label*="Submit"]',
    'button:has(svg[data-icon="arrow-up"])',
    'button:has(svg[class*="send"])',
    'button[type="submit"]'
  ];
  
  for(const selector of selectors){
    const btn=document.querySelector(selector);
    if(btn && !btn.hasAttribute("disabled"))return btn;
  }
  
  if(platform==="ChatGPT"){
    return Array.from(document.querySelectorAll("button")).find(btn=>
      btn.querySelector("svg") && !btn.hasAttribute("disabled")
    )||null;
  }
  
  return null;
}

function waitForElement(selector,timeout=10000){
  return new Promise((resolve,reject)=>{
    const element=document.querySelector(selector);
    if(element){
      resolve(element);
      return;
    }
    
    const observer=new MutationObserver(()=>{
      const el=document.querySelector(selector);
      if(el){
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.body,{
      childList:true,
      subtree:true
    });
    
    setTimeout(()=>{
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    },timeout);
  });
}

function delay(ms){
  return new Promise(resolve=>setTimeout(resolve,ms));
}

typeof r<"u"&&r.exports&&(r.exports={executePromptOnPlatform:executePrompt});

});export default p();
