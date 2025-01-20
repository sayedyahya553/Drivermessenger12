// تنظیمات Firebase (این‌ها رو از کنسول Firebase کپی کن)
const firebaseConfig = {
    apiKey: "API_KEY",
    authDomain: "PROJECT_ID.firebaseapp.com",
    databaseURL: "https://PROJECT_ID.firebaseio.com",
    projectId: "PROJECT_ID",
    storageBucket: "PROJECT_ID.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();

// ارسال پیام متنی
const sendButton = document.getElementById('sendButton');
const messageInput = document.getElementById('messageInput');
const messagesDiv = document.getElementById('messages');

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        database.ref('messages').push({
            type: 'text',
            text: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        messageInput.value = '';
    }
});

// ارسال فایل
const sendFileButton = document.getElementById('sendFileButton');
const fileInput = document.getElementById('fileInput');

sendFileButton.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (file) {
        const storageRef = storage.ref('files/' + file.name);
        storageRef.put(file).then((snapshot) => {
            snapshot.ref.getDownloadURL().then((url) => {
                database.ref('messages').push({
                    type: 'file',
                    url: url,
                    name: file.name,
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            });
        });
    }
});

// دریافت و نمایش پیام‌ها
database.ref('messages').on('child_added', (snapshot) => {
    const message = snapshot.val();
    const messageElement = document.createElement('div');

    if (message.type === 'text') {
        messageElement.textContent = message.text;
    } else if (message.type === 'file') {
        const linkElement = document.createElement('a');
        linkElement.href = message.url;
        linkElement.textContent = `دانلود فایل: ${message.name}`;
        linkElement.target = "_blank";
        messageElement.appendChild(linkElement);
    }

    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
// ایجاد گروه جدید
const createGroupButton = document.getElementById('createGroupButton');
const groupNameInput = document.getElementById('groupNameInput');

createGroupButton.addEventListener('click', () => {
    const groupName = groupNameInput.value;
    if (groupName) {
        database.ref('groups').push({
            name: groupName,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        groupNameInput.value = '';
    }
});
const groupsDiv = document.getElementById('groups');

database.ref('groups').on('child_added', (snapshot) => {
    const group = snapshot.val();
    const groupElement = document.createElement('div');
    groupElement.textContent = group.name;
    groupElement.addEventListener('click', () => {
        loadGroupChat(snapshot.key);
    });
    groupsDiv.appendChild(groupElement);
});

function loadGroupChat(groupId) {
    messagesDiv.innerHTML = ''; // پاک کردن پیام‌های قبلی
    database.ref('groups/' + groupId + '/messages').on('child_added', (snapshot) => {
        const message = snapshot.val();
        const messageElement = document.createElement('div');

        if (message.type === 'text') {
            messageElement.textContent = message.text;
        } else if (message.type === 'file') {
            const linkElement = document.createElement('a');
            linkElement.href = message.url;
            linkElement.textContent = `دانلود فایل: ${message.name}`;
            linkElement.target = "_blank";
            messageElement.appendChild(linkElement);
        }

        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });
}
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message && currentGroupId) {
        database.ref('groups/' + currentGroupId + '/messages').push({
            type: 'text',
            text: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        messageInput.value = '';
    }
});
const messaging = firebase.messaging();

messaging.requestPermission().then(() => {
    return messaging.getToken();
}).then((token) => {
    console.log('Token:', token);
    // توکن رو در دیتابیس ذخیره کن تا بتونی نوتیفیکیشن ارسال کنی
    database.ref('tokens').push({ token: token });
});
messaging.onMessage((payload) => {
    console.log('Message received:', payload);
    // نمایش نوتیفیکیشن به کاربر
    new Notification(payload.notification.title, {
        body: payload.notification.body
    });
});