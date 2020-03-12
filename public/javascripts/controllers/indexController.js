app.controller('indexController', ['$scope', 'indexFactory', ($scope, indexFactory) => {

    $scope.messages = [];
    $scope.players = {};

    $scope.init = () => {
        const username = prompt('Please enter username');

        if (username) {
            initSocket(username)
        }
        else {
            return false;
        }
    }

    function showBubble(id, message) {
        $('#' + id).find('.message').show().html(message);
        setTimeout(() => {
            $('#' + id).find('.message').hide();
        }, 2000)
    }

    function scrollTop() {
        setTimeout(() => {
            const element = document.getElementById('chat-area');
            element.scrollTop = element.scrollHeight;
        })
    }

    async function initSocket(username) {
        const connectionOptions = {
            reconnectionAttempts: 3,
            reconnectionDelay: 600,
        };

        try {
            const socket = await indexFactory.connectSocket('http://localhost:3000', connectionOptions);

            socket.emit('newUser', { username });
            socket.on('initPlayers', (players) => {
                $scope.players = players;
                $scope.$apply();
            })

            socket.on('newUser', (data) => {
                const messageData = {
                    type: {
                        code: 0,//  server or user message
                        message: 0// connect or disconnect message
                    },
                    username: data.username
                };
                $scope.messages.push(messageData);
                $scope.players[data.id] = data;
                $scope.$apply();
            })
            socket.on('disUser', (user) => {
                const messageData = {
                    type: {
                        code: 0,//  server or user message
                        message: 1// connect or disconnect message
                    },
                    username: user.username
                };
                $scope.messages.push(messageData);
                delete $scope.players[user.id]
                $scope.$apply();
            })
            $scope.onClickPlayer = ($event) => {
                console.log($event.offsetX, $event.offsetY);
                let x = $event.offsetX, y = $event.offsetY;
                socket.emit('animate', { x, y })
                $('#' + socket.id).animate({ 'left': x, 'top': y })
            }

            socket.on('animate', (data) => {
                $('#' + data.socketId).animate({ 'left': data.x, 'top': data.y })
            })

            $scope.newMessage = () => {
                let message = $scope.message;
                const messageData = {
                    type: {
                        code: 1
                    },
                    username: username,
                    text: message
                }

                $scope.messages.push(messageData);
                $scope.message = '';

                socket.emit('newMessage', messageData);

                showBubble(socket.id, message)
                scrollTop();

            }
            socket.on('newMessage', (data) => {
                $scope.messages.push(data);
                $scope.$apply();
                showBubble(data.socketId, data.text)
                scrollTop();
            })
        } catch (error) {
            console.log(error)
        }

    }
}])