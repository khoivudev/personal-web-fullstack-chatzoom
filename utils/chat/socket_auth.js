module.exports = {
    onAuthorizeSuccess: function(data, accept) {
        console.log('successful connection to socket.io');
        accept(null, true);
    },

    onAuthorizeFail: function(data, message, error, accept) {
        if (error) throw new Error(message);
        console.log('failed connection to socket.io:', message);
        accept(null, false);
    },
};