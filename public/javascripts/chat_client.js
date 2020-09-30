const chatForm = document.getElementById('room-form');
const chatMessages = document.querySelector('.room-messages');
const roomName = document.getElementById('room-name');
const usersList = document.getElementById('users');

const socket = io();
var username = "";

//Get Room from URL
const { room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
})

//Get username from socket
//Join chatroom
socket.emit('joinRoom', { room });

//Get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});

//Message from SERVER
socket.on('message', message => {
    console.log(message);
    outputMessage(message);

    //Scroll down 
    chatMessages.scrollTop = chatMessages.scrollHeight;
})

//Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    //Get message text
    const msg = e.target.elements.msg.value;

    //Emit message to server
    socket.emit('chatMessage', msg);

    //Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
})

//Output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    if (message.client) {
        username = message.client;
    }

    if (message.username == username) {
        div.innerHTML = `<div class="client"><p class="meta">${message.username} <span>${message.time}</span>
        <p class="text">${message.text}</p></div>`;
    } else {
        div.innerHTML = `<div class="server"><p class="meta">${message.username} <span>${message.time}</span>
        <p class="text">${message.text}</p></div>`;
    }

    document.querySelector('.room-messages').appendChild(div);
}

//Add room name to DOM
function outputRoomName(room) {
    roomName.innerText = room;
}

//Add user to DOM
function outputUsers(users) {
    usersList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
    `;
}