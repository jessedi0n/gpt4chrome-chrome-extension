// on first install open the options page to set the API key
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.runtime.openOptionsPage();
    }
});

// create a default system message
function defaultSystemMessage() {
    const systemMessage = "You are GPT4Chrome a chrome extension that provides a helpful and friendly chatbot, based on the OpenAi GPT models, that the user can access without leaving the favorite website. Your answers will be compact.";
    return systemMessage;
}

// listen for messages from the popup
chrome.runtime.onMessage.addListener(async function (request) {
    try {
        // get the API key and model from the storage
        const { apiKey, apiModel } = await getStorageData(['apiKey', 'apiModel']);
        const currentConversation = request.messages || [];

        if (!apiKey) {
            throw new Error('API key is missing or invalid');
        }

        if (!apiModel) {
            throw new Error('API model is missing or invalid');
        }

        if (!Array.isArray(currentConversation)) {
            throw new Error('Conversation is not an array');
        }

        // add the default system message to the conversation
        const conversation = [
            { role: 'system', content: defaultSystemMessage() },
            ...currentConversation,
        ];

        // send the request to the OpenAI API
        const response = await sendApiRequest(apiKey, apiModel, conversation);

        // check if the response is valid and send it to the popup
        if (response?.choices?.[0]?.message?.content) {
            const message = response.choices[0].message.content;
            sendResponse({ answer: message });
        } else {
            throw new Error('API response is missing or invalid');
        }
    } catch (error) {
        // log the error
        console.log(error);

        // send the error message to the popup
        sendResponse({ answer: getErrorMessage(error) });
    }

    return true;

    // get the data from the storage
    async function getStorageData(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (data) => resolve(data));
        });
    }

    // send the request to the OpenAI API
    async function sendApiRequest(apiKey, apiModel, currentConversation) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: apiModel,
                messages: currentConversation,
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch. Status code: ${response.status}`);
        }

        return response.json();
    }

    // send the response to the popup
    function sendResponse(data) {
        chrome.runtime.sendMessage(data);
    }

    // create a error message based on the error
    function getErrorMessage(error) {
        switch (error.message) {
            case 'API key is missing or invalid':
                return 'Sorry, I can\'t understand you. Make sure your API-Key is correct.';
            case 'API model is missing or invalid':
                return 'Sorry, I can\'t understand you. Make sure a API model is set.';
            case 'Conversation is not an array':
                return 'Sorry, I can\'t understand you. Make sure your conversation is a valid array.';
            case 'API response is missing or invalid':
                return 'Sorry, I can\'t understand you. The API response is invalid.';
            default:
                return 'Sorry, I can\'t understand you. An error occurred.';
        }
    }
});