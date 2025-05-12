const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// State variables
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "AIzaSyCzGevf1eQGLV5kMv-zl0Hrdaz6R1iyP1I"; 
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

//  Improved Quadratic Equation Detector
const isQuadraticEquation = (message) => {
    return /([-+]?\d*)?x\s*\²\s*([-+]\s*\d*x)?\s*([-+]\s*\d+)?\s*=\s*0/i.test(message) || 
           /([-+]?\d*)?x\^2\s*([-+]\s*\d*x)?\s*([-+]\s*\d+)?\s*=\s*0/i.test(message);
};

//  Create chat message element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

//  Show typing effect
const showTypingEffect = (text, messageElement) => {
    let index = 0;
    // Clean up text: remove $ symbols and boxed{}
    const cleanText = text
        .replace(/\$/g, '')               // Remove all dollar signs
        .replace(/\\boxed{([^}]+)}/g, '$1') // Replace \boxed{10} with just 10
        .replace(/boxed{([^}]+)}/g, '$1');  // Also handle boxed without \

    messageElement.innerText = "";

    const typingInterval = setInterval(() => {
        messageElement.innerText += cleanText[index++];
        if (index === cleanText.length) {
            clearInterval(typingInterval);
            isGeneratingResponse = false;
        }
    }, 50);
};

//  Handle different types of user input
const handleOutgoingMessage = async () => {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim();
    if (!currentUserMessage || isGeneratingResponse) return;

    isGeneratingResponse = true;

    // Add user's outgoing message
    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/profile.png" alt="User avatar">
            <p class="message__text">${currentUserMessage}</p>
        </div>
    `;
    chatHistoryContainer.appendChild(createChatMessageElement(outgoingMessageHtml, "message--outgoing"));

    // Now call the API and wait for the bot's reply
    await requestApiResponse();
};

const requestApiResponse = async () => {
    // Create bot's incoming loading message
    const loadingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" alt="avatar">
            <p class="message__text">Solving...</p>
            <div class="message__loading-indicator">
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
                <div class="message__loading-bar"></div>
            </div>
        </div>
    `;
    const loadingMessageElement = createChatMessageElement(loadingMessageHtml, "message--incoming");
    chatHistoryContainer.appendChild(loadingMessageElement);

    try {
        const response = await fetch(API_REQUEST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Solve this maths problem step by step: ${currentUserMessage}` }] }]
            }),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error?.message || "Unknown API error");

        let responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't solve this equation.";

        // Clean up the response text
        responseText = responseText
            .replace(/\$/g, '')
            .replace(/\\boxed{([^}]+)}/g, '$1')
            .replace(/boxed{([^}]+)}/g, '$1');

        // Remove loading indicator first
        chatHistoryContainer.removeChild(loadingMessageElement);

        // Now finally show the clean response
        const responseMessageHtml = `
            <div class="message__content">
                <img class="message__avatar">
                <p class="message__text"></p>
            </div>
        `;
        const responseMessageElement = createChatMessageElement(responseMessageHtml, "message--incoming");
        chatHistoryContainer.appendChild(responseMessageElement);

        const messageTextElement = responseMessageElement.querySelector(".message__text");
        showTypingEffect(responseText, messageTextElement);
    } catch (error) {
        console.error("API Error:", error);
        chatHistoryContainer.removeChild(loadingMessageElement);
        const errorMessageHtml = `
            <div class="message__content">
                <img class="message__avatar">
                <p class="message__text">⚠️ Error: ${error.message}</p>
            </div>
        `;
        chatHistoryContainer.appendChild(createChatMessageElement(errorMessageHtml, "message--incoming"));
    } finally {
        isGeneratingResponse = false;
    }
};

// Form submit event
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});
