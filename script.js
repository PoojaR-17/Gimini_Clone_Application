const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-List .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;    
// script.js
import { API_KEY } from './api.js';

console.log(API_KEY); // Use the API key in your logic

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY }`;

const loadLocalstorageData = () =>{
    const savedChats = localStorage.getItem("savedChats")
    const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

    //apply the stored theme
    document.body.classList.toggle("light_mode",isLightMode);
    toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";
     
    //restore saved chats
    chatList.innerHTML = savedChats || "";
    document.body.classList.toggle("hide-header",savedChats);
    chatList.scrollTo(0, chatList.scrollHeight);
}  

loadLocalstorageData();
// Create a new message element and return it
const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
}

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
    // Clean up text: remove special characters like #, *, and trim whitespace
    const cleanText = text.replace(/[#*]/g, '').trim();
    
    // Split the text into paragraphs by line breaks
    const paragraphs = cleanText.split('\n').filter(paragraph => paragraph.trim() !== '');

    let currentParagraphIndex = 0;

    const typeParagraph = () => {
        if (currentParagraphIndex < paragraphs.length) {
            let words = paragraphs[currentParagraphIndex].split(' ');
            let currentWordIndex = 0;
            isResponseGenerating = true; 

            const typingInterval = setInterval(() => {
                if (currentWordIndex < words.length) {
                    textElement.innerHTML += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
                    // Hide the icon when typing
                    incomingMessageDiv.querySelector(".icon").classList.add("hide");
                } else {
                    clearInterval(typingInterval);
                    isResponseGenerating = false;
                    localStorage.setItem("savedChats", chatList.innerHTML); // Save chats to local storage
                    textElement.innerHTML += '<br><br>';  // Add spacing between paragraphs
                    currentParagraphIndex++;
                    typeParagraph();  // Move to the next paragraph
                    // Show the icon after typing
                    incomingMessageDiv.querySelector(".icon").classList.remove("hide");
                }

                chatList.scrollTo(0, chatList.scrollHeight);

            }, 75); // Adjust typing speed here
        }
    };

    // Start typing the first paragraph
    typeParagraph();
};



// Fetch response from API based on user message
const generateAPIresponse = async (incomingMessageDiv) => {
    const textElement = incomingMessageDiv.querySelector(".text");

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();

        const apiResponse = data?.candidates[0].content.parts[0].text || "No response found";
        showTypingEffect(apiResponse,textElement);


    } catch (error) {
        console.log(error);
        isResponseGenerating = flase
        textElement.textContent = "Error fetching API response"; // Display error on the web
    } finally {
        incomingMessageDiv.classList.remove("loading");
    }
};


// Show a loading animation while waiting for the API response
const showLoadingAnimation = () => {
    const html = `
        <div class="message-content">
            <img src="gemini.svg" alt="Gemini" class="image">
            <p class="text"></p>
            <div class="loading-indicator">
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
                <div class="loading-bar"></div>
            </div>
        </div>
        <span onclick="copyMessage(this)" class="icon material-symbols-outlined">content_copy</span>`;

    const incomingMessageDiv = createMessageElement(html, "incoming");
    chatList.appendChild(incomingMessageDiv);

    generateAPIresponse(incomingMessageDiv);
}

//Copy message text to the clipboard
const copyMessage = (copyIcon) =>{
    const messageText = copyIcon.parentElement.querySelector(".text").innerText;
    navigator.clipboard.writeText(messageText);
    copyIcon.innerText = "done";//show tick icon
    setTimeout(()=> copyIcon.innerText = "content_copy", 1000);//Revert icon after 1 sec
}
// Handle sending outgoing chat message
const handleOutgoingChat = () => {
    userMessage = typingForm.querySelector(".typing-input").value.trim() ||  userMessage;
    if (!userMessage || isResponseGenerating ) return; // Exit if there is no message
    isResponseGenerating = true
    const html = `
        <div class="message-content">
            <img src="Pooja.jpg" alt="Pooja" class="image">
            <p class="text">${userMessage}</p>
        </div>`;

    const outgoingMessageDiv = createMessageElement(html, "outgoing");
    chatList.appendChild(outgoingMessageDiv);

    typingForm.reset(); // Clear input field
    document.body.classList.add("hide-header");//hide the header once chat starts
    chatList.scrollTo(0, chatList.scrollHeight);
    // Show loading animation after a short delay
    setTimeout(showLoadingAnimation, 500); 
}
suggestions.forEach(suggestions =>{
    suggestions.addEventListener("click",() =>{
        userMessage = suggestions.querySelector('.text').innerText;
        handleOutgoingChat();
    })
})

toggleThemeButton.addEventListener("click",()=>{
    const isLightMode = document.body.classList.toggle("light_mode");
    localStorage.setItem("themeColor",isLightMode? "light_mode" :"dark_mode" );
    toggleThemeButton.innerText = isLightMode? "dark_mode" : "light_mode";
    
});
//Dlete all message from local storage
deleteChatButton.addEventListener("click",()=>{
    if(confirm("Are you sure you want to delete all messages?")){
        localStorage.removeItem("savedChats");
        loadLocalstorageData();
    }
})

typingForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleOutgoingChat();
});
