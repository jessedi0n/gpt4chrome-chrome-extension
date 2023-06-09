import hljs from 'highlight.js';

const conversationList = document.getElementById('conversation-list');
const conversationListWrapper = document.getElementById('conversation-list-wrapper');
const chat = document.getElementById('chat');
const chatWrapper = document.getElementById('chat-wrapper');
const chatHeaderTitle = document.getElementById('chat-header-title');
const toggleConversationsButton = document.getElementById('toggle-conversations-button');
const toggleConversationsIcon = document.getElementById('toggle-conversations-icon');
const inputSearch = document.getElementById('input-search');
const inputForm = document.getElementById('input-message');
const sendMessageIcon = document.getElementById('send-message-icon');
const buttonSendMessage = document.getElementById('button-send-message');
const addConversationButton = document.getElementById('new-conversation-button');
const clearConversationsButton = document.getElementById('clear-conversations-button');
const openGithubButton = document.getElementById('open-github-button');
const openOptionsButton = document.getElementById('open-options-button');
const loadingIndicator = document.getElementById('loading-indicator');
const deleteModal = document.getElementById("deleteModal");
const cancelButton = document.getElementById("cancel-button");
const deleteButton = document.getElementById("delete-button");


let isLoading = false;
let selectedConversation = 0;

// initialize the conversations on popup load
initConversation();

// initialize the conversations
function initConversation() {
    // get the conversation list
    chrome.storage.local.get(['conversations'], (result) => {
        // if there are no conversations, create a new one
        if (result.conversations == null || result.conversations.length === 0) {

            // save a new conversation to the storage
            chrome.storage.local.set({
                conversations: [{
                    id: 0,
                    name: 'Chat 1',
                    messages: []
                }]
            }, () => {
                // get the conversation list
                chrome.storage.local.get(['conversations'], (result) => {
                    // set the conversation list
                    displayConversations(result.conversations);
                });
            });
        } else {
            // set the conversation list
            displayConversations(result.conversations);
        }
    });
}

// set the conversation list
function displayConversations(conversations) {

    // clear the conversation list
    conversationListWrapper.innerHTML = '';

    // loop through the conversations
    conversations.forEach((conversation) => {

        // create a new conversation element
        const conversationElement = document.createElement('div');
        conversationElement.classList.add('conversation');

        // give the conversation element a unique id
        conversationElement.id = 'conversation-' + conversation.id;

        // add message icon to the conversation element
        const conversationIcon = document.createElement('i');
        conversationIcon.classList.add('fa-regular');
        conversationIcon.classList.add('fa-message');
        conversationIcon.classList.add('me-2');

        conversationElement.appendChild(conversationIcon);

        // create new conversation name element
        const conversationName = document.createElement('div');
        conversationName.classList.add('conversation-name');
        conversationName.innerText = conversation.name;

        conversationElement.appendChild(conversationName);

        // add a delete icon to the conversation element that shows on hover
        const deleteIcon = document.createElement('i');
        deleteIcon.classList.add('fa');
        deleteIcon.classList.add('fa-trash');
        deleteIcon.classList.add('delete-conversation-icon');
        deleteIcon.classList.add('d-none');

        // add event listener to delete icon to delete the conversation on click
        deleteIcon.addEventListener('click', () => {
            deleteConversation(conversation.id);
        });

        // add event listener to conversation element to show the delete icon on hover
        conversationElement.addEventListener('mouseover', () => {
            deleteIcon.classList.remove('d-none');
        });

        // add event listener to conversation element to hide the delete icon on hover
        conversationElement.addEventListener('mouseout', () => {
            deleteIcon.classList.add('d-none');
        });

        // append the delete icon to the conversation element
        conversationElement.appendChild(deleteIcon);

        // add event listener to conversation element to load messages on click
        conversationElement.addEventListener('click', () => {
            // remove the active class from the selected conversation per id if it exists
            const selectedConversationElement = document.getElementById('conversation-' + selectedConversation);
            if (selectedConversationElement) {
                selectedConversationElement.classList.remove('active');
            }

            // add the active class to the clicked conversation
            conversationElement.classList.add('active');

            // set the selected conversation to the clicked conversation
            selectedConversation = conversation.id;

            // show the messages of the clicked conversation
            showMessagesByConversation(conversation.id);
        });

        // append the conversation element to the conversation list
        conversationListWrapper.appendChild(conversationElement);

        // display the messages of the selected conversation
        if (conversation.id === selectedConversation) {
            showMessagesByConversation(conversation.id);
        }
    });
}

// delete a conversation
function deleteConversation(conversationId) {

    // get the conversation list
    chrome.storage.local.get(['conversations'], (result) => {

        // remove the conversation from the conversation list
        result.conversations.splice(conversationId, 1);

        // loop through the conversation list and update the id's
        result.conversations.forEach((conversation, index) => {
            conversation.id = index;
        });

        // save the updated conversation list
        chrome.storage.local.set({
            conversations: result.conversations
        });

        // set the selected conversation
        if (conversationId > 0) {
            selectedConversation = conversationId - 1;
        } else {
            selectedConversation = 0;
        }

        // initialize the conversations
        initConversation();
    });
}

// add a new conversation when the button is clicked
addConversationButton.addEventListener('click', () => {
    // get the conversation list
    chrome.storage.local.get(['conversations'], (result) => {

        // create a new conversation
        const newConversation = {
            id: result.conversations.length,
            name: 'Chat ' + (result.conversations.length + 1),
            messages: []
        };

        // add the new conversation to the conversation list
        result.conversations.push(newConversation);

        // set the new conversation list to the storage
        chrome.storage.local.set({
            conversations: result.conversations
        });

        // select the new conversation
        selectedConversation = newConversation.id;

        // display the conversation list
        displayConversations(result.conversations);

        // remove the search input value
        inputSearch.value = '';

        // scroll to the bottom of the conversation list
        conversationListWrapper.scrollTop = conversationListWrapper.scrollHeight;
    });
});

// Toggle the conversation list on and off when the toggle button is clicked
toggleConversationsButton.addEventListener('click', function () {
    // if conversation list has class hidden, show it
    if (conversationList.classList.contains('chats-hidden')) {
        conversationList.classList.remove('chats-hidden');
        toggleConversationsIcon.classList.add('fa-bars');
    } else {
        conversationList.classList.add('chats-hidden');
        toggleConversationsIcon.classList.add('fa-bars');
    }
});

// display conversation messages
function showMessagesByConversation(conversationId) {
    // focus on the input field
    inputForm.focus();

    // set the selected conversation by index
    selectedConversation = conversationId;

    // clear the chat wrapper
    chatWrapper.innerHTML = '';

    displayWelcomeMessage();

    // get the conversation list from the storage
    chrome.storage.local.get(['conversations'], (result) => {
        const conversation = result.conversations[conversationId];

        // loop through the messages if there are any
        if (conversation.messages.length > 0) {
            conversation.messages.forEach((message) => {

                if (message.role == 'user') {
                    addUserMessage(message.content);
                } else {
                    addAssistantMessage(message.content);
                }
                // scroll to the bottom of the chat wrapper
                chatWrapper.scrollTop = chatWrapper.scrollHeight;

            });
        }

        // set the chat header title to the current conversation name
        chatHeaderTitle.innerText = conversation.name;

        // get the conversationelement and set button to active
        const conversationElement = document.getElementById('conversation-' + conversation.id);
        conversationElement.classList.add('active');

        // clear the input field
        inputForm.value = '';
    });
}

// Focus the input field by default
inputForm.focus();

// Enable the send button when the user types something in the input field
inputForm.addEventListener('keyup', () => {
    if (inputForm.value.trim() === '' || isLoading) {
        buttonSendMessage.disabled = true;
    } else {
        buttonSendMessage.disabled = false;
    }
});

// if textarea is focused and the user presses the enter key, send the message. If the user presses shift + enter, add a new line
inputForm.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        buttonSendMessage.click();
    }
});

// On send button click, send the message
buttonSendMessage.addEventListener('click', () => {
    sendMessage();
});

// Send the message
function sendMessage() {
    isLoading = true;

    // Get the message
    const message = inputForm.value;

    // Add the user message to the chat wrapper
    addUserMessage(message);

    // set the the new message to the storage and send the conversation to the background script
    chrome.storage.local.get(['conversations'], (result) => {
        const conversation = result.conversations[selectedConversation];

        // add the message to the conversation
        conversation.messages.push({
            role: 'user',
            content: message
        });

        // set the the conversationmessages to the storage
        chrome.storage.local.set({
            conversations: result.conversations
        });

        // Send the message to the background script
        chrome.runtime.sendMessage({ messages: conversation.messages });

    });
    // disable the send button
    buttonSendMessage.disabled = true;

    // Clear the input field
    inputForm.value = '';

    // Toggle the send button and loading indicator
    toggleLoadingIndicator();

    // set the send button to disabled
    buttonSendMessage.disabled = true;

    // scroll to the bottom of the chat wrapper
    chatWrapper.scrollTop = chatWrapper.scrollHeight;
};

// add the user message to the chat wrapper
function addUserMessage(message) {
    // create a new user message element
    const userMessage = document.createElement('div');
    userMessage.classList.add('message');
    userMessage.classList.add('user');

    // create message wrapper and append
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');
    messageWrapper.classList.add('user');
    userMessage.appendChild(messageWrapper);

    // create message text and append
    const messageText = document.createElement('div');
    messageText.classList.add('message-text');
    messageText.innerText = message;
    messageWrapper.appendChild(messageText);

    // append the user message to the chat wrapper
    chatWrapper.appendChild(userMessage);
}

// add the assistant message to the chat wrapper
function addAssistantMessage(message) {
    // create a new assistant message element
    const assistantMessage = document.createElement('div');
    assistantMessage.classList.add('message');
    assistantMessage.classList.add('assistant');
    // add id to the message by seaching for the the size of the chat wrapper
    assistantMessage.id = 'message-' + chatWrapper.childElementCount;

    // create avatar and append
    const avatar = document.createElement('div');
    avatar.classList.add('avatar');
    // add icon
    const icon = document.createElement('i');
    icon.classList.add('assistant-icon');
    icon.classList.add('fas');
    icon.classList.add('fa-robot');
    avatar.appendChild(icon);

    assistantMessage.appendChild(avatar);

    // create message wrapper and append
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message-wrapper');
    messageWrapper.classList.add('assistant');

    assistantMessage.appendChild(messageWrapper);

    // create message text and append
    const messageText = document.createElement('div');
    messageText.classList.add('message-text');

    // if the text contains code parts ``` code ```  wrap the parts in a code block
    if (message.includes('```')) {

        const codeParts = message.split('```');

        codeParts.forEach((part, index) => {
            // if the index is even, add the text to the message
            if (index % 2 == 0) {
                // remove new line from the beginning of the string
                if (part.startsWith('\n')) {
                    part = part.substring(1);
                }
                // create text element and append
                const text = document.createElement('span');
                text.innerText = part;
                messageText.appendChild(text);
            } else {
                // create a pre element and append
                const codeBlock = document.createElement('pre');
                codeBlock.classList.add('code-block');

                // create a code element and append
                const code = document.createElement('code');

                // get the language of the code block and remove it from the string
                const language = part.split('\n')[0];
                part = part.replace(language + '\n', '');

                // add the highlighted code to the code block
                code.classList.add('hljs');
                code.innerHTML = hljs.highlightAuto(part).value;

                // append the code to the code block
                codeBlock.appendChild(code);

                // append the code block to the message text
                messageText.appendChild(codeBlock);
            }
        });
    } else {
        messageText.innerText = message;
    }

    messageWrapper.appendChild(messageText);

    // create action row and append
    const actionRow = document.createElement('div');
    actionRow.classList.add('action-row');
    actionRow.appendChild(copyMessageToClipboard(message));
    messageWrapper.appendChild(actionRow);

    // append the assistant message to the chat wrapper
    chatWrapper.appendChild(assistantMessage);
}

// highlight the code
function highlight(code, language) {
    return hljs.highlight(code, { language: language }).value;
}

// creates and returns a copy to clipboard button
function copyMessageToClipboard(message) {
    const button = document.createElement("div");
    button.classList.add("copy-to-clipboard-button");
    button.innerHTML = '<i class="fa fa-copy"></i>';

    // on click save the message to the clipboard
    button.addEventListener('click', () => {
        // save the message to the clipboard
        navigator.clipboard.writeText(message);
        // change the icon to a checkmark
        button.innerHTML = '<i class="fas fa-check"></i>';
        // change the icon back to a copy icon after 3 seconds
        setTimeout(function () {
            button.innerHTML = '<i class="fas fa-copy"></i>';
            // button.removeChild(span);
        }, 3000);
    });

    // append the button to the body
    document.body.appendChild(button);

    return button;
}

// save the message to the selected conversation in the storage
function saveMessageToSelectedConversation(message, from) {

    // create a new message
    const newMessage = {
        role: from,
        content: message
    };

    // save the message to the selected conversation in the storage
    chrome.storage.local.get(['conversations'], (result) => {
        result.conversations[selectedConversation].messages.push(newMessage);

        chrome.storage.local.set({
            conversations: result.conversations
        });

        // scroll to the bottom of the chat wrapper
        chatWrapper.scrollTop = chatWrapper.scrollHeight;
    });
}

// display the welcome message 
function displayWelcomeMessage() {
    // create a new welcome message element
    const welcomeMessage = document.createElement('div');
    // add id
    welcomeMessage.id = 'welcome-message';
    // create a h1
    const welcomeMessageH1 = document.createElement('h1');
    welcomeMessageH1.innerText = 'Welcome to GPT4Chrome!';

    // create a p
    const welcomeMessageP = document.createElement('p');
    welcomeMessageP.innerText = 'Type a message and press enter to start chatting.';
    welcomeMessageP.className = 'mb-2';

    // append the h1 and p to the welcome message
    welcomeMessage.appendChild(welcomeMessageH1);
    welcomeMessage.appendChild(welcomeMessageP);

    // append the welcome message to the chat wrapper
    chatWrapper.appendChild(welcomeMessage);
}

// hide the loading indicator by default
loadingIndicator.style.display = 'none';

// disable send button when sending a message and display the loading indicator
function toggleLoadingIndicator() {
    if (!isLoading) {
        sendMessageIcon.style.display = 'inline-block';
        loadingIndicator.style.display = 'none';
    } else {
        sendMessageIcon.style.display = 'none';
        loadingIndicator.style.display = 'inline-block';
    }
}

// listen for messages from the background script
chrome.runtime.onMessage.addListener(({ answer, error }) => {
    // if the assistant has an answer
    if (answer) {
        // add the assistant message to the chat wrapper
        addAssistantMessage(answer);
        // save the message to the selected conversation
        saveMessageToSelectedConversation(answer, 'assistant');
    } else if (error) {
        addAssistantMessage(error);
    }

    isLoading = false;

    // toggle loading indicator
    toggleLoadingIndicator();

    // set the send button to disabled
    buttonSendMessage.disabled = true;

    // scroll to the bottom of the chat wrapper smoothly
    chatWrapper.scrollTop = chatWrapper.scrollHeight;
});

// on typing in the search input the conversation list will be filtered
inputSearch.addEventListener('input', () => {
    // get the value of the search input
    const searchValue = inputSearch.value.toLowerCase();

    // get all the conversation list items
    const conversationListItems = document.querySelectorAll('.conversation');

    // loop through all the conversation list items
    conversationListItems.forEach((conversationListItem) => {

        // get the conversation name
        const conversationName = conversationListItem.innerText.toLowerCase();

        // if the conversation name contains the search value
        if (conversationName.includes(searchValue)) {
            // show the conversation list item
            conversationListItem.style.display = 'flex';
        } else {
            // hide the conversation list item
            conversationListItem.style.display = 'none';
        }
    });
});

// open options page when clicking on the options button
openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
});

// open github page when clicking on the github button
openGithubButton.addEventListener('click', () => {
    window.open('https://github.com/jessedi0n/gpt4chrome');
});

// When the user clicks on the clear button, show the modal
clearConversationsButton.onclick = function () {
    deleteModal.style.display = "flex";
}

// When the user clicks on cancel, close the modal
cancelButton.onclick = function () {
    deleteModal.style.display = "none";
}

// When the user clicks on delete, clear the conversations
deleteButton.onclick = function () {
    // clear the conversation list
    chrome.storage.local.set({
        conversations: []
    });

    // reset the selected conversation
    selectedConversation = 0;

    // initialize a new conversation
    initConversation();

    // remove the search input value
    inputSearch.value = '';

    // close the modal
    deleteModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
    if (event.target == deleteModal) {
        deleteModal.style.display = "none";
    }
}

// on double click on the chat header title the conversation name can be edited
chatHeaderTitle.addEventListener('dblclick', () => {
    // get the conversation name
    const conversationName = chatHeaderTitle.innerText;

    // remove the conversation name
    chatHeaderTitle.innerText = '';

    // create input wrapper
    const inputGroup = document.createElement('div');
    inputGroup.className = 'rename-input-wrapper';

    // create an input
    const input = document.createElement('input');
    input.id = 'rename-conversation-input';
    input.type = 'text';
    input.value = conversationName;

    inputGroup.appendChild(input);

    // enable the save button when typing in the input. the the name has not changed the save button will be disabled
    input.addEventListener('input', () => {
        // get the save button
        const saveButton = document.getElementById('rename-conversation-save-button');

        // if the input value is not equal to the conversation name
        if (input.value !== conversationName && input.value !== '') {
            // enable the save button
            saveButton.disabled = false;
        } else {
            // disable the save button
            saveButton.disabled = true;
        }
    });

    // create a save button
    const saveButton = document.createElement('button');
    saveButton.id = 'rename-conversation-save-button';
    saveButton.disabled = true;

    // add icon
    const saveButtonIcon = document.createElement('i');
    saveButtonIcon.className = 'fas fa-check';

    saveButton.appendChild(saveButtonIcon);

    // on click save button
    saveButton.addEventListener('click', () => {
        // save the new conversation name
        saveRenameConversation(input.value);
    });

    inputGroup.appendChild(saveButton);

    // create a cancel button
    const cancelButton = document.createElement('button');
    cancelButton.id = 'rename-conversation-cancel-button';

    // add icon
    const cancelButtonIcon = document.createElement('i');
    cancelButtonIcon.className = 'fas fa-times';

    cancelButton.appendChild(cancelButtonIcon);

    // on click cancel button
    cancelButton.addEventListener('click', () => {
        // remove the input
        chatHeaderTitle.removeChild(chatHeaderTitle.firstChild);

        // display the conversation name
        chatHeaderTitle.innerText = conversationName;
    });

    inputGroup.appendChild(cancelButton);

    // on keyup
    input.addEventListener('keyup', (e) => {
        // if the key is enter
        if (e.key === 'Enter') {
            // save the new conversation name
            saveRenameConversation(input.value);
        }
    });

    // append the input to the chat header title
    chatHeaderTitle.appendChild(inputGroup);

    // focus the input
    input.focus();
});

// save the new conversation name
function saveRenameConversation(conversationName) {
    // save the new conversation name to the storage
    chrome.storage.local.get(['conversations'], (result) => {
        result.conversations[selectedConversation].name = conversationName;

        // save the new conversation name to the storage
        chrome.storage.local.set({
            conversations: result.conversations
        });
    });

    // remove the input
    chatHeaderTitle.removeChild(chatHeaderTitle.firstChild);

    // display the conversation name
    chatHeaderTitle.innerText = conversationName;

    // update the conversation list item
    updateConversationListItem(selectedConversation, conversationName);
}

// update the conversation list item
function updateConversationListItem(conversationId, conversationName) {
    // get the conversation list item
    const conversationListItem = document.getElementById(`conversation-${conversationId}`);

    // get the conversation name element
    const conversationNameElement = conversationListItem.querySelector('.conversation-name');

    // update the conversation name
    conversationNameElement.innerText = conversationName;
}