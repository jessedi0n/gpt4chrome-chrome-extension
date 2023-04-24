// on first install open the options page to set the API key
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        chrome.tabs.create({ url: "options/options.html" });
    }
});

// create a default system message
function defaultSystemMessage() {
    const systemMessage = "You are GPT4Chrome a chrome extension that provides a helpful and friendly chatbot, based on the OpenAi GPT models, that the user can access without leaving the favorite website. Your answers will be compact.";
    return systemMessage;
}

// listen for a request from the content script
chrome.runtime.onMessage.addListener(async function (request) {
    // get the API key from local storage
    let apiKey = await new Promise(resolve => chrome.storage.local.get(['apiKey'], result => resolve(result.apiKey)));

    // get the API model from local storage
    let apiModel = await new Promise(resolve => chrome.storage.local.get(['apiModel'], result => resolve(result.apiModel)));

    // check if the request contains a message that the user sent a new message
    if (request.messages) {

        // initialize the message array with the default system message
        let conversation = [
            { role: "system", content: defaultSystemMessage() }
        ];

        // Add the current converversation to the message array
        currentConversation = conversation.concat(request.messages);

        try {
            // send the request containing the messages to the OpenAI API
            let response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    "model": apiModel,
                    "messages": currentConversation,
                })
            });

            // check if the API response is ok, else throw an error
            if (!response.ok) {
                throw new Error(`Failed to fetch. Status code: ${response.status}`);
            }

            // get the data from the API response as json
            let data = await response.json();

            // check if the API response contains an answer
            if (data && data.choices && data.choices.length > 0) {
                // get the answer from the API response
                let message = data.choices[0].message.content;

                // send the answer back to the content script
                chrome.runtime.sendMessage({ answer: message });

                // Add the response from the assistant to the message array
                conversation.push({ role: "assistant", content: message });
            }
        } catch (error) {
            console.log(error);

            // send error message back to the content script
            chrome.runtime.sendMessage({ answer: "Sorry, I can't understand you. Make sure your API-Key is correct." });

            // return false to indicate that there was an error
            return false;
        }
    }

    // return true to indicate that the message has been handled
    return true;
});