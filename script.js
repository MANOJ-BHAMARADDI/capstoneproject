const messageForm = document.querySelector(".prompt__form");
const chatHistoryContainer = document.querySelector(".chats");
const themeToggleButton = document.getElementById("themeToggler");
const clearChatButton = document.getElementById("deleteButton");

// State variables
let currentUserMessage = null;
let isGeneratingResponse = false;

const GOOGLE_API_KEY = "AIzaSyCzGevf1eQGLV5kMv-zl0Hrdaz6R1iyP1I"; // 🔹 Replace with your actual API key
const API_REQUEST_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;

// ✅ Improved Quadratic Equation Detector
const isQuadraticEquation = (message) => {
    return /([-+]?\d*)?x\s*\²\s*([-+]\s*\d*x)?\s*([-+]\s*\d+)?\s*=\s*0/i.test(message) || 
           /([-+]?\d*)?x\^2\s*([-+]\s*\d*x)?\s*([-+]\s*\d+)?\s*=\s*0/i.test(message);
};

// ✅ Create chat message element
const createChatMessageElement = (htmlContent, ...cssClasses) => {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", ...cssClasses);
    messageElement.innerHTML = htmlContent;
    return messageElement;
};

// ✅ Show typing effect
const showTypingEffect = (text, messageElement) => {
    let index = 0;
    messageElement.innerText = "";

    const typingInterval = setInterval(() => {
        messageElement.innerText += text[index++];
        if (index === text.length) {
            clearInterval(typingInterval);
            isGeneratingResponse = false;
        }
    }, 50);
};

// ✅ Handle different types of user input
const handleOutgoingMessage = () => {
    currentUserMessage = messageForm.querySelector(".prompt__form-input").value.trim().toLowerCase();
    if (!currentUserMessage || isGeneratingResponse) return;

    isGeneratingResponse = true;

    let botResponse = "";
    
    if (currentUserMessage === "hi") {
        botResponse = "Hello, there!";
    } 
    else if (currentUserMessage.includes("teach me quadratic equations")) {
        botResponse = `Quadratic equations are in the form ax² + bx + c = 0.  
They can be solved using the quadratic formula:  
x = (-b ± √(b² - 4ac)) / 2a.  

For example, solving **x² - 4x + 4 = 0**:  
1. Identify coefficients: a = 1, b = -4, c = 4  
2. Compute discriminant: (-4)² - 4(1)(4) = 0  
3. Solve: x = (-(-4) ± √0) / (2 * 1) = 2  

Since the discriminant is 0, we have only one solution: **x = 2**.`;
    } 
    else if (isQuadraticEquation(currentUserMessage)) {
        requestApiResponse();
        return;
    } 
    else {
        botResponse = "⚠️ Out of context. Please ask about quadratic equations (e.g., x² + 5x + 8 = 0).";
    }

    // Append user's message
    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/profile.png" alt="User avatar">
            <p class="message__text">${currentUserMessage}</p>
        </div>
    `;
    chatHistoryContainer.appendChild(createChatMessageElement(outgoingMessageHtml, "message--outgoing"));

    // Append bot's response
    const incomingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
            <p class="message__text"></p>
        </div>
    `;
    const incomingMessageElement = createChatMessageElement(incomingMessageHtml, "message--incoming");
    chatHistoryContainer.appendChild(incomingMessageElement);

    const messageTextElement = incomingMessageElement.querySelector(".message__text");
    showTypingEffect(botResponse, messageTextElement);

    isGeneratingResponse = false;
};

// ✅ Fetch API response for quadratic equation solving
const requestApiResponse = async () => {
    const outgoingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/profile.png" alt="User avatar">
            <p class="message__text">${currentUserMessage}</p>
        </div>
    `;
    chatHistoryContainer.appendChild(createChatMessageElement(outgoingMessageHtml, "message--outgoing"));

    // Show loading
    const loadingMessageHtml = `
        <div class="message__content">
            <img class="message__avatar" src="assets/gemini.svg" alt="Gemini avatar">
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
                contents: [{ parts: [{ text: `Solve this quadratic equation step by step: ${currentUserMessage}` }] }]
            }),
        });

        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.error?.message || "Unknown API error");

        const responseText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "Couldn't solve this equation.";
        
        // Replace loading message with response
        chatHistoryContainer.removeChild(loadingMessageElement);
        const responseMessageHtml = `
            <div class="message__content">
                <img class="message__avatar" src="assets/gemini.png" alt="Gemini avatar">
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
                <img class="message__avatar" src="assets/gemini.png" alt="Gemini avatar">
                <p class="message__text">⚠️ Error: ${error.message}</p>
            </div>
        `;
        chatHistoryContainer.appendChild(createChatMessageElement(errorMessageHtml, "message--incoming"));
    }
};

// ✅ Event Listeners
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleOutgoingMessage();
});
